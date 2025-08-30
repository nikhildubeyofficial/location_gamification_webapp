const express = require('express')
const Mission = require('../models/Mission')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/missions/active
// @desc    Get user's active missions
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const missions = await Mission.find({
      'participants.user': req.user._id,
      'participants.status': 'active',
      isActive: true
    }).populate('createdBy', 'username')

    const activeMissions = missions.map(mission => {
      const participant = mission.participants.find(p => p.user.toString() === req.user._id.toString())
      return {
        ...mission.toObject(),
        userProgress: participant.progress,
        completionPercentage: mission.getCompletionPercentage(req.user._id),
        startedAt: participant.startedAt
      }
    })

    res.json({ missions: activeMissions })
  } catch (error) {
    console.error('Get active missions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/missions/available
// @desc    Get available missions for user
// @access  Private
router.get('/available', auth, async (req, res) => {
  try {
    const { category, type, difficulty } = req.query

    const query = {
      isActive: true,
      $or: [
        { isGlobal: true },
        { createdBy: req.user._id }
      ],
      'participants.user': { $ne: req.user._id }
    }

    if (category) query.category = category
    if (type) query.type = type
    if (difficulty) query.difficulty = difficulty

    const missions = await Mission.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ missions })
  } catch (error) {
    console.error('Get available missions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/missions/join/:missionId
// @desc    Join a mission
// @access  Private
router.post('/join/:missionId', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.missionId)

    if (!mission || !mission.isActive) {
      return res.status(404).json({ message: 'Mission not found or inactive' })
    }

    // Check if already participating
    const existingParticipant = mission.participants.find(p => p.user.toString() === req.user._id.toString())
    if (existingParticipant) {
      return res.status(400).json({ message: 'Already participating in this mission' })
    }

    // Check time limit
    if (mission.timeLimit && mission.timeLimit.expiresAt && new Date() > mission.timeLimit.expiresAt) {
      return res.status(400).json({ message: 'Mission has expired' })
    }

    mission.participants.push({
      user: req.user._id,
      progress: {
        steps: 0,
        distance: 0,
        activeTime: 0,
        locationsVisited: [],
        friendsInvited: 0
      },
      status: 'active',
      startedAt: new Date()
    })

    mission.metadata.totalParticipants += 1
    await mission.save()

    res.json({
      message: 'Successfully joined mission',
      mission: {
        ...mission.toObject(),
        userProgress: mission.participants[mission.participants.length - 1].progress,
        completionPercentage: 0
      }
    })
  } catch (error) {
    console.error('Join mission error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/missions/complete/:missionId
// @desc    Complete a mission
// @access  Private
router.post('/complete/:missionId', auth, async (req, res) => {
  try {
    const { customData } = req.body

    const mission = await Mission.findById(req.params.missionId)
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    const participant = mission.participants.find(p => p.user.toString() === req.user._id.toString())
    if (!participant || participant.status !== 'active') {
      return res.status(400).json({ message: 'Not actively participating in this mission' })
    }

    // Check if mission is actually completed
    if (!mission.isCompletedByUser(req.user._id)) {
      return res.status(400).json({ message: 'Mission requirements not met' })
    }

    // Mark as completed
    participant.status = 'completed'
    participant.completedAt = new Date()

    // Award rewards
    const user = await User.findById(req.user._id)
    const rewards = {}

    if (mission.rewards.xp) {
      const xpResult = user.addXP(mission.rewards.xp)
      rewards.xp = mission.rewards.xp
      rewards.levelUp = xpResult.leveledUp
      rewards.newLevel = xpResult.newLevel
    }

    if (mission.rewards.coins) {
      user.addCoins(mission.rewards.coins)
      rewards.coins = mission.rewards.coins
    }

    if (mission.rewards.badge) {
      const existingBadge = user.gameStats.badges.find(b => b.id === mission.rewards.badge.id)
      if (!existingBadge) {
        user.gameStats.badges.push({
          ...mission.rewards.badge,
          unlockedAt: new Date()
        })
        rewards.badge = mission.rewards.badge
      }
    }

    await user.save()
    await mission.save()

    // Update mission completion rate
    const completedCount = mission.participants.filter(p => p.status === 'completed').length
    mission.metadata.completionRate = (completedCount / mission.metadata.totalParticipants) * 100

    // Calculate average completion time
    const completedParticipants = mission.participants.filter(p => p.status === 'completed')
    if (completedParticipants.length > 0) {
      const totalTime = completedParticipants.reduce((sum, p) => {
        return sum + (new Date(p.completedAt) - new Date(p.startedAt))
      }, 0)
      mission.metadata.averageCompletionTime = (totalTime / completedParticipants.length) / 1000 / 60 / 60 // hours
    }

    await mission.save()

    res.json({
      message: 'Mission completed successfully!',
      mission: mission.toObject(),
      rewards
    })
  } catch (error) {
    console.error('Complete mission error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/missions/completed
// @desc    Get user's completed missions
// @access  Private
router.get('/completed', auth, async (req, res) => {
  try {
    const missions = await Mission.find({
      'participants.user': req.user._id,
      'participants.status': 'completed'
    }).populate('createdBy', 'username')

    const completedMissions = missions.map(mission => {
      const participant = mission.participants.find(p => p.user.toString() === req.user._id.toString())
      return {
        ...mission.toObject(),
        completedAt: participant.completedAt,
        timeTaken: (new Date(participant.completedAt) - new Date(participant.startedAt)) / 1000 / 60 / 60 // hours
      }
    })

    res.json({ missions: completedMissions })
  } catch (error) {
    console.error('Get completed missions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/missions/create
// @desc    Create a new mission
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const missionData = {
      ...req.body,
      createdBy: req.user._id,
      isGlobal: false // User-created missions are not global by default
    }

    const mission = new Mission(missionData)
    await mission.save()

    res.status(201).json({
      message: 'Mission created successfully',
      mission
    })
  } catch (error) {
    console.error('Create mission error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/missions/leaderboard/:missionId
// @desc    Get mission leaderboard
// @access  Private
router.get('/leaderboard/:missionId', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.missionId)
      .populate('participants.user', 'username avatar gameStats.level')

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    const leaderboard = mission.getLeaderboard()

    res.json({ leaderboard })
  } catch (error) {
    console.error('Get mission leaderboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/missions/progress/:missionId
// @desc    Update mission progress
// @access  Private
router.put('/progress/:missionId', auth, async (req, res) => {
  try {
    const { progressData } = req.body

    const mission = await Mission.findById(req.params.missionId)
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    const updatedParticipant = mission.updateProgress(req.user._id, progressData)
    await mission.save()

    res.json({
      message: 'Progress updated',
      progress: updatedParticipant.progress,
      completionPercentage: mission.getCompletionPercentage(req.user._id),
      completed: updatedParticipant.status === 'completed'
    })
  } catch (error) {
    console.error('Update mission progress error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Initialize default missions
router.post('/init-defaults', async (req, res) => {
  try {
    const defaultMissions = [
      {
        name: "First Steps",
        description: "Take your first 1000 steps to begin your fitness journey!",
        type: "fitness",
        category: "daily",
        difficulty: "easy",
        requirements: { steps: 1000 },
        rewards: { xp: 50, coins: 10, badge: { id: "first_steps", name: "First Steps", description: "Completed first 1000 steps", icon: "👣" } },
        isGlobal: true
      },
      {
        name: "Distance Walker",
        description: "Walk 2 kilometers in a single session",
        type: "fitness",
        category: "daily",
        difficulty: "medium",
        requirements: { distance: 2000 },
        rewards: { xp: 100, coins: 25 },
        isGlobal: true
      },
      {
        name: "Green Commuter",
        description: "Use eco-friendly transport for 5km",
        type: "sustainability",
        category: "weekly",
        difficulty: "easy",
        requirements: { distance: 5000 },
        rewards: { xp: 150, coins: 30, badge: { id: "green_commuter", name: "Green Commuter", description: "Eco-friendly travel champion", icon: "🌱" } },
        isGlobal: true
      },
      {
        name: "Social Explorer",
        description: "Invite 3 friends to join your fitness journey",
        type: "social",
        category: "weekly",
        difficulty: "medium",
        requirements: { friends: 3 },
        rewards: { xp: 200, coins: 50 },
        isGlobal: true
      }
    ]

    for (const missionData of defaultMissions) {
      const existingMission = await Mission.findOne({ name: missionData.name })
      if (!existingMission) {
        const mission = new Mission(missionData)
        await mission.save()
      }
    }

    res.json({ message: 'Default missions initialized' })
  } catch (error) {
    console.error('Init default missions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
