const express = require('express')
const Session = require('../models/Session')
const User = require('../models/User')
const Mission = require('../models/Mission')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   POST /api/fitness/start
// @desc    Start a new fitness session
// @access  Private
router.post('/start', auth, async (req, res) => {
  try {
    const { type, startLocation } = req.body

    // Check if user has an active session
    const activeSession = await Session.findOne({
      user: req.user._id,
      status: 'active'
    })

    if (activeSession) {
      return res.status(400).json({ message: 'You already have an active session' })
    }

    const session = new Session({
      user: req.user._id,
      type: type || 'walking',
      startTime: new Date(),
      route: {
        startLocation: startLocation || {}
      }
    })

    await session.save()

    res.status(201).json({
      message: 'Session started successfully',
      session
    })
  } catch (error) {
    console.error('Start session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/fitness/update/:sessionId
// @desc    Update fitness session with new data
// @access  Private
router.put('/update/:sessionId', auth, async (req, res) => {
  try {
    const { waypoint, stats } = req.body

    const session = await Session.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
      status: 'active'
    })

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' })
    }

    // Add waypoint if provided
    if (waypoint) {
      session.addWaypoint(waypoint)
    }

    // Update stats if provided
    if (stats) {
      Object.keys(stats).forEach(key => {
        if (session.stats[key] !== undefined) {
          session.stats[key] = stats[key]
        }
      })
    }

    await session.save()

    res.json({
      message: 'Session updated successfully',
      session
    })
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/fitness/stop/:sessionId
// @desc    Stop and complete fitness session
// @access  Private
router.post('/stop/:sessionId', auth, async (req, res) => {
  try {
    const { endLocation } = req.body

    const session = await Session.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
      status: 'active'
    })

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' })
    }

    // Set end location
    if (endLocation) {
      session.route.endLocation = endLocation
    }

    // Complete the session
    session.complete()

    // Check for achievements
    const achievements = session.checkAchievements()

    await session.save()

    // Update user stats
    const user = await User.findById(req.user._id)
    user.gameStats.totalSteps += session.stats.steps
    user.gameStats.totalDistance += session.stats.distance
    user.gameStats.totalActiveTime += session.duration

    // Add XP and coins for the session
    let xpGained = Math.floor(session.stats.distance / 100) + Math.floor(session.duration / 5) // 1 XP per 100m + 1 XP per 5 min
    let coinsGained = Math.floor(xpGained / 10) // 1 coin per 10 XP

    const xpResult = user.addXP(xpGained)
    user.addCoins(coinsGained)

    // Add achievement badges
    achievements.forEach(achievement => {
      const existingBadge = user.gameStats.badges.find(badge => badge.id === achievement.type)
      if (!existingBadge) {
        user.gameStats.badges.push({
          id: achievement.type,
          name: achievement.name,
          description: achievement.description,
          icon: `achievement_${achievement.type}`,
          unlockedAt: new Date()
        })
        xpGained += achievement.xpReward
        coinsGained += achievement.coinReward
      }
    })

    await user.save()

    // Update mission progress
    const activeMissions = await Mission.find({
      'participants.user': req.user._id,
      'participants.status': 'active',
      isActive: true
    })

    const missionUpdates = []
    for (const mission of activeMissions) {
      const progressUpdate = {
        steps: session.stats.steps,
        distance: session.stats.distance,
        activeTime: session.duration
      }

      mission.updateProgress(req.user._id, progressUpdate)
      await mission.save()
      missionUpdates.push({
        missionId: mission._id,
        name: mission.name,
        completed: mission.isCompletedByUser(req.user._id)
      })
    }

    res.json({
      message: 'Session completed successfully',
      session,
      achievements,
      rewards: {
        xp: xpGained,
        coins: coinsGained,
        levelUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel
      },
      missionUpdates
    })
  } catch (error) {
    console.error('Stop session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/fitness/sessions
// @desc    Get user's fitness sessions
// @access  Private
router.get('/sessions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { user: req.user._id }
    if (status) query.status = status

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Session.countDocuments(query)

    res.json({
      sessions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/fitness/session/:sessionId
// @desc    Get specific session details
// @access  Private
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      user: req.user._id
    })

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    res.json({ session })
  } catch (error) {
    console.error('Get session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/fitness/geofence-entry
// @desc    Record geofence entry
// @access  Private
router.post('/geofence-entry', auth, async (req, res) => {
  try {
    const { sessionId, geofenceId, geofenceName, entryTime } = req.body

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'active'
    })

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' })
    }

    // Check if already entered this geofence
    const existingEntry = session.geofences.find(g => g.id === geofenceId && !g.exitedAt)
    if (existingEntry) {
      return res.status(400).json({ message: 'Already inside this geofence' })
    }

    session.geofences.push({
      id: geofenceId,
      name: geofenceName,
      enteredAt: entryTime || new Date()
    })

    await session.save()

    res.json({
      message: 'Geofence entry recorded',
      geofence: { id: geofenceId, name: geofenceName }
    })
  } catch (error) {
    console.error('Geofence entry error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/fitness/geofence-exit
// @desc    Record geofence exit
// @access  Private
router.post('/geofence-exit', auth, async (req, res) => {
  try {
    const { sessionId, geofenceId, exitTime } = req.body

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'active'
    })

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' })
    }

    const geofenceEntry = session.geofences.find(g => g.id === geofenceId && !g.exitedAt)
    if (!geofenceEntry) {
      return res.status(400).json({ message: 'No active entry for this geofence' })
    }

    geofenceEntry.exitedAt = exitTime || new Date()
    geofenceEntry.timeSpent = (geofenceEntry.exitedAt - geofenceEntry.enteredAt) / 1000 / 60 // minutes

    await session.save()

    res.json({
      message: 'Geofence exit recorded',
      timeSpent: geofenceEntry.timeSpent
    })
  } catch (error) {
    console.error('Geofence exit error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/fitness/active-session
// @desc    Get current active session
// @access  Private
router.get('/active-session', auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      user: req.user._id,
      status: 'active'
    })

    res.json({ session })
  } catch (error) {
    console.error('Get active session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
