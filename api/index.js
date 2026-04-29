const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─── Models (inline to avoid path issues in serverless) ───

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  techStack: [String],
  link: { type: String },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a name'], trim: true },
  email: { type: String, required: [true, 'Please add an email'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'] },
  password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  university: { type: String, default: '' },
  year: { type: String, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'PhD', ''], default: '' },
  skills: [{ type: String, trim: true }],
  interests: [{ type: String, trim: true }],
  projects: [projectSchema],
  collaborations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration' }],
  skillLevels: { type: Map, of: Number, default: {} },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const collaborationRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  projectIdea: { title: { type: String }, description: { type: String } },
  createdAt: { type: Date, default: Date.now },
});

const collaborationSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  project: { title: { type: String, required: true }, description: { type: String }, outcome: { type: String } },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a team name'], trim: true },
  description: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: {
    title: { type: String },
    description: { type: String },
    techStack: [String],
    status: { type: String, enum: ['planning', 'in-progress', 'completed', 'on-hold'], default: 'planning' },
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const CollaborationRequest = mongoose.models.CollaborationRequest || mongoose.model('CollaborationRequest', collaborationRequestSchema);
const Collaboration = mongoose.models.Collaboration || mongoose.model('Collaboration', collaborationSchema);
const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);

// ─── Database Connection (cached) ───

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  const conn = await mongoose.connect(process.env.MONGO_URI);
  cachedDb = conn;
  return conn;
}

// ─── Auth Middleware ───

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (!req.user) return res.status(401).json({ message: 'User not found' });
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── Express App ───

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Connect to DB before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB Connection Error:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Auth Routes ───

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, university, year } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, university: university || '', year: year || '' });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, token: generateToken(user._id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, token: generateToken(user._id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
});

// ─── User Routes ───

app.get('/api/users', protect, async (req, res) => {
  try {
    const { skills, interests, university, search } = req.query;
    let query = { _id: { $ne: req.user._id } };

    if (skills) {
      const skillsArr = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArr };
    }
    if (interests) {
      const interestsArr = interests.split(',').map(s => s.trim());
      query.interests = { $in: interestsArr };
    }
    if (university) query.university = { $regex: university, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { interests: { $in: [new RegExp(search, 'i')] } },
      ];
      query._id = { $ne: req.user._id };
    }

    const users = await User.find(query).select('-__v');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/matches', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    const allUsers = await User.find({ _id: { $ne: currentUser._id } });

    const usersWithMatch = allUsers.map(user => {
      const commonSkills = user.skills.filter(s => currentUser.skills.map(cs => cs.toLowerCase()).includes(s.toLowerCase()));
      const commonInterests = user.interests.filter(i => currentUser.interests.map(ci => ci.toLowerCase()).includes(i.toLowerCase()));
      const totalCurrent = currentUser.skills.length + currentUser.interests.length;
      const totalCommon = commonSkills.length + commonInterests.length;
      const matchPercent = totalCurrent > 0 ? Math.round((totalCommon / totalCurrent) * 100) : 0;
      return { ...user.toObject(), commonSkills, commonInterests, matchPercent };
    });

    usersWithMatch.sort((a, b) => b.matchPercent - a.matchPercent);
    res.json(usersWithMatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('collaborations');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const { name, bio, university, year, skills, interests, projects, avatar, skillLevels } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (university !== undefined) user.university = university;
    if (year !== undefined) user.year = year;
    if (skills) user.skills = skills;
    if (interests) user.interests = interests;
    if (projects) user.projects = projects;
    if (avatar !== undefined) user.avatar = avatar;
    if (skillLevels) user.skillLevels = skillLevels;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Collaboration Routes ───

app.post('/api/collaborations/requests', protect, async (req, res) => {
  try {
    const { to, message, projectIdea } = req.body;
    if (to === req.user._id.toString()) return res.status(400).json({ message: 'Cannot send request to yourself' });

    const existingRequest = await CollaborationRequest.findOne({ from: req.user._id, to, status: 'pending' });
    if (existingRequest) return res.status(400).json({ message: 'Request already sent' });

    const request = await CollaborationRequest.create({ from: req.user._id, to, message, projectIdea });
    const populatedRequest = await CollaborationRequest.findById(request._id)
      .populate('from', 'name email avatar skills')
      .populate('to', 'name email avatar skills');

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/collaborations/requests', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type === 'received') query.to = req.user._id;
    else if (type === 'sent') query.from = req.user._id;
    else query.$or = [{ from: req.user._id }, { to: req.user._id }];

    const requests = await CollaborationRequest.find(query)
      .populate('from', 'name email avatar skills')
      .populate('to', 'name email avatar skills')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/collaborations/requests/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await CollaborationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.to.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      await Collaboration.create({
        participants: [request.from, request.to],
        project: { title: request.projectIdea?.title || 'Untitled Collaboration', description: request.projectIdea?.description || '' },
        status: 'active',
      });
    }

    const populatedRequest = await CollaborationRequest.findById(req.params.id)
      .populate('from', 'name email avatar skills')
      .populate('to', 'name email avatar skills');

    res.json(populatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/collaborations/history', protect, async (req, res) => {
  try {
    const collaborations = await Collaboration.find({ participants: req.user._id })
      .populate('participants', 'name email avatar skills')
      .populate('team')
      .sort({ createdAt: -1 });
    res.json(collaborations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/collaborations/:id', protect, async (req, res) => {
  try {
    const { status, outcome, endDate } = req.body;
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    if (!collaboration.participants.includes(req.user._id)) return res.status(403).json({ message: 'Not authorized' });

    if (status) collaboration.status = status;
    if (outcome) collaboration.project.outcome = outcome;
    if (endDate) collaboration.endDate = endDate;
    await collaboration.save();

    const updated = await Collaboration.findById(req.params.id)
      .populate('participants', 'name email avatar skills')
      .populate('team');
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Team Routes ───

app.post('/api/teams', protect, async (req, res) => {
  try {
    const { name, description, project } = req.body;
    const team = await Team.create({ name, description, lead: req.user._id, members: [req.user._id], project: project || {} });
    const populatedTeam = await Team.findById(team._id).populate('members', 'name email avatar skills').populate('lead', 'name email avatar');
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams', protect, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user._id }).populate('members', 'name email avatar skills').populate('lead', 'name email avatar').sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/teams/:id', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'name email avatar skills').populate('lead', 'name email avatar');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/teams/:id', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.lead.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only team lead can update' });

    const { name, description, project } = req.body;
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (project) team.project = { ...team.project, ...project };
    await team.save();

    const updated = await Team.findById(req.params.id).populate('members', 'name email avatar skills').populate('lead', 'name email avatar');
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/teams/:id/members', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.lead.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only team lead can add members' });

    const { userId } = req.body;
    if (team.members.includes(userId)) return res.status(400).json({ message: 'User is already a member' });

    team.members.push(userId);
    await team.save();

    const updated = await Team.findById(req.params.id).populate('members', 'name email avatar skills').populate('lead', 'name email avatar');
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/teams/:id/members/:userId', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.lead.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only team lead can remove members' });

    team.members = team.members.filter(m => m.toString() !== req.params.userId);
    await team.save();

    const updated = await Team.findById(req.params.id).populate('members', 'name email avatar skills').populate('lead', 'name email avatar');
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export for Vercel serverless
module.exports = app;
