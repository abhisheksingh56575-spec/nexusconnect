const express = require('express');
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/teams
// @desc    Create a new team
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, project } = req.body;

    const team = await Team.create({
      name,
      description,
      lead: req.user._id,
      members: [req.user._id],
      project: project || {},
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'name email avatar skills')
      .populate('lead', 'name email avatar');

    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teams
// @desc    Get user's teams
router.get('/', protect, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user._id })
      .populate('members', 'name email avatar skills')
      .populate('lead', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teams/:id
// @desc    Get team by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email avatar skills')
      .populate('lead', 'name email avatar');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/teams/:id
// @desc    Update team
router.put('/:id', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.lead.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team lead can update' });
    }

    const { name, description, project } = req.body;
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (project) team.project = { ...team.project, ...project };

    await team.save();

    const updated = await Team.findById(req.params.id)
      .populate('members', 'name email avatar skills')
      .populate('lead', 'name email avatar');

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/teams/:id/members
// @desc    Add member to team
router.post('/:id/members', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.lead.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team lead can add members' });
    }

    const { userId } = req.body;

    if (team.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    team.members.push(userId);
    await team.save();

    const updated = await Team.findById(req.params.id)
      .populate('members', 'name email avatar skills')
      .populate('lead', 'name email avatar');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('addedToTeam', updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/teams/:id/members/:userId
// @desc    Remove member from team
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.lead.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team lead can remove members' });
    }

    team.members = team.members.filter(m => m.toString() !== req.params.userId);
    await team.save();

    const updated = await Team.findById(req.params.id)
      .populate('members', 'name email avatar skills')
      .populate('lead', 'name email avatar');

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
