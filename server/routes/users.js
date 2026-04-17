const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (with optional filters)
router.get('/', protect, async (req, res) => {
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

    if (university) {
      query.university = { $regex: university, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { interests: { $in: [new RegExp(search, 'i')] } },
      ];
      delete query._id;
      query._id = { $ne: req.user._id };
    }

    const users = await User.find(query).select('-__v');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/matches
// @desc    Get users with matching skills/interests (sorted by match %)
router.get('/matches', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    const allUsers = await User.find({ _id: { $ne: currentUser._id } });

    const usersWithMatch = allUsers.map(user => {
      const commonSkills = user.skills.filter(s =>
        currentUser.skills.map(cs => cs.toLowerCase()).includes(s.toLowerCase())
      );
      const commonInterests = user.interests.filter(i =>
        currentUser.interests.map(ci => ci.toLowerCase()).includes(i.toLowerCase())
      );

      const totalCurrent = currentUser.skills.length + currentUser.interests.length;
      const totalCommon = commonSkills.length + commonInterests.length;
      const matchPercent = totalCurrent > 0 ? Math.round((totalCommon / totalCurrent) * 100) : 0;

      return {
        ...user.toObject(),
        commonSkills,
        commonInterests,
        matchPercent,
      };
    });

    usersWithMatch.sort((a, b) => b.matchPercent - a.matchPercent);
    res.json(usersWithMatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('collaborations');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, university, year, skills, interests, projects, avatar, skillLevels } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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

module.exports = router;
