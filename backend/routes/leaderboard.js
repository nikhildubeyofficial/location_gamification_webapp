const express = require('express')
const Leaderboard = require('../models/Leaderboard')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/leaderboard
// @desc    Get leaderboards
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'weekly', category = 'xp', limit = 50 } = req.query

    let leaderboard = await Leaderboard.findOne({
      type,
      category,
      isActive: true
    }).populate('entries.user', 'username avatar gameStats sustainabilityStats')

    if (!leaderboard) {
      // Create leaderboard if it doesn't exist
      const users = await User.find({})
        .sort({ [`gameStats.${category === 'eco_score' ? 'sustainabilityStats.ecoScore' : category === 'steps' ? 'totalSteps' : category === 'distance' ? 'totalDistance' : 'xp'}`]: -1 })
        .limit(limit)

      leaderboard = await Leaderboard.createOrUpdate(type, category, users)
      await leaderboard.populate('entries.user', 'username avatar gameStats sustainabilityStats')
    }

    const topEntries = leaderboard.getTop(limit)
    const userPosition = leaderboard.getUserPosition(req.user._id)

    res.json({
      leaderboard: {
        type,
        category,
        entries: topEntries,
        userPosition,
        lastUpdated: leaderboard.lastUpdated
      }
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/leaderboard/around-me
// @desc    Get leaderboard entries around current user
// @access  Private
router.get('/around-me', auth, async (req, res) => {
  try {
    const { type = 'weekly', category = 'xp', range = 5 } = req.query

    const leaderboard = await Leaderboard.findOne({
      type,
      category,
      isActive: true
    }).populate('entries.user', 'username avatar gameStats')

    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found' })
    }

    const entriesAroundUser = leaderboard.getUsersAround(req.user._id, parseInt(range))

    res.json({
      entries: entriesAroundUser,
      userPosition: leaderboard.getUserPosition(req.user._id)
    })
  } catch (error) {
    console.error('Get leaderboard around user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/leaderboard/update
// @desc    Update leaderboards (admin/system)
// @access  Private
router.post('/update', auth, async (req, res) => {
  try {
    const { type, category } = req.body

    // Get users sorted by the specified category
    let sortField = 'gameStats.xp'
    if (category === 'steps') sortField = 'gameStats.totalSteps'
    else if (category === 'distance') sortField = 'gameStats.totalDistance'
    else if (category === 'active_time') sortField = 'gameStats.totalActiveTime'
    else if (category === 'eco_score') sortField = 'sustainabilityStats.ecoScore'

    const users = await User.find({}).sort({ [sortField]: -1 }).limit(100)

    const leaderboard = await Leaderboard.createOrUpdate(type, category, users)

    res.json({
      message: 'Leaderboard updated successfully',
      leaderboard: {
        type: leaderboard.type,
        category: leaderboard.category,
        totalEntries: leaderboard.entries.length,
        lastUpdated: leaderboard.lastUpdated
      }
    })
  } catch (error) {
    console.error('Update leaderboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/leaderboard/friends
// @desc    Get friends leaderboard
// @access  Private
router.get('/friends', auth, async (req, res) => {
  try {
    const { category = 'xp' } = req.query

    const user = await User.findById(req.user._id).populate('socialStats.friends', 'username avatar gameStats sustainabilityStats')

    if (!user.socialStats.friends || user.socialStats.friends.length === 0) {
      return res.json({ entries: [] })
    }

    // Include current user in the comparison
    const allUsers = [user, ...user.socialStats.friends]

    // Sort by category
    let sortedUsers
    switch (category) {
      case 'steps':
        sortedUsers = allUsers.sort((a, b) => b.gameStats.totalSteps - a.gameStats.totalSteps)
        break
      case 'distance':
        sortedUsers = allUsers.sort((a, b) => b.gameStats.totalDistance - a.gameStats.totalDistance)
        break
      case 'active_time':
        sortedUsers = allUsers.sort((a, b) => b.gameStats.totalActiveTime - a.gameStats.totalActiveTime)
        break
      case 'eco_score':
        sortedUsers = allUsers.sort((a, b) => b.sustainabilityStats.ecoScore - a.sustainabilityStats.ecoScore)
        break
      default:
        sortedUsers = allUsers.sort((a, b) => b.gameStats.xp - a.gameStats.xp)
    }

    const entries = sortedUsers.map((user, index) => {
      let score = user.gameStats.xp
      if (category === 'steps') score = user.gameStats.totalSteps
      else if (category === 'distance') score = user.gameStats.totalDistance
      else if (category === 'active_time') score = user.gameStats.totalActiveTime
      else if (category === 'eco_score') score = user.sustainabilityStats.ecoScore

      return {
        user: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          gameStats: user.gameStats
        },
        rank: index + 1,
        score,
        isCurrentUser: user._id.toString() === req.user._id.toString()
      }
    })

    res.json({ entries })
  } catch (error) {
    console.error('Get friends leaderboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/leaderboard/mission/:missionId
// @desc    Get mission-specific leaderboard
// @access  Private
router.get('/mission/:missionId', auth, async (req, res) => {
  try {
    const Mission = require('../models/Mission')
    
    const mission = await Mission.findById(req.params.missionId)
      .populate('participants.user', 'username avatar gameStats')

    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' })
    }

    const leaderboard = mission.getLeaderboard()

    res.json({
      missionName: mission.name,
      leaderboard
    })
  } catch (error) {
    console.error('Get mission leaderboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/leaderboard/all
// @desc    Get all current leaderboards
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    const leaderboards = await Leaderboard.getCurrentLeaderboards()

    res.json({ leaderboards })
  } catch (error) {
    console.error('Get all leaderboards error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
