const express = require('express');
const CollaborationRequest = require('../models/CollaborationRequest');
const Collaboration = require('../models/Collaboration');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/collaborations/requests
// @desc    Send a collaboration request
router.post('/requests', protect, async (req, res) => {
  try {
    const { to, message, projectIdea } = req.body;

    if (to === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    const existingRequest = await CollaborationRequest.findOne({
      from: req.user._id,
      to,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const request = await CollaborationRequest.create({
      from: req.user._id,
      to,
      message,
      projectIdea,
    });

    const populatedRequest = await CollaborationRequest.findById(request._id)
      .populate('from', 'name email avatar skills')
      .populate('to', 'name email avatar skills');

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(to).emit('newRequest', populatedRequest);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/collaborations/requests
// @desc    Get all requests (sent & received)
router.get('/requests', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    
    if (type === 'received') {
      query.to = req.user._id;
    } else if (type === 'sent') {
      query.from = req.user._id;
    } else {
      query.$or = [{ from: req.user._id }, { to: req.user._id }];
    }

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

// @route   PUT /api/collaborations/requests/:id
// @desc    Accept or reject a request
router.put('/requests/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await CollaborationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      // Create a collaboration record
      const collaboration = await Collaboration.create({
        participants: [request.from, request.to],
        project: {
          title: request.projectIdea?.title || 'Untitled Collaboration',
          description: request.projectIdea?.description || '',
        },
        status: 'active',
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(request.from.toString()).emit('requestAccepted', { request, collaboration });
      }
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

// @route   GET /api/collaborations/history
// @desc    Get collaboration history
router.get('/history', protect, async (req, res) => {
  try {
    const collaborations = await Collaboration.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar skills')
      .populate('team')
      .sort({ createdAt: -1 });

    res.json(collaborations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/collaborations/:id
// @desc    Update collaboration (mark completed, add outcome)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, outcome, endDate } = req.body;
    const collaboration = await Collaboration.findById(req.params.id);

    if (!collaboration) {
      return res.status(404).json({ message: 'Collaboration not found' });
    }

    if (!collaboration.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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

module.exports = router;
