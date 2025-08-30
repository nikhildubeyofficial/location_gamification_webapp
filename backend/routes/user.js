const express = require('express')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { profile, preferences } = req.body
    
    const user = await User.findById(req.user._id)
    
    if (profile) {
      user.profile = { ...user.profile, ...profile }
    }
    
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences }
    }
    
    await user.save()
    
    const updatedUser = await User.findById(req.user._id).select('-password')
    res.json({ user: updatedUser })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/avatar
// @desc    Update user avatar
// @access  Private
router.put('/avatar', auth, async (req, res) => {
  try {
    const { model, color, accessories, customizations } = req.body
    
    const user = await User.findById(req.user._id)
    
    if (model) user.avatar.model = model
    if (color) user.avatar.color = color
    if (accessories) user.avatar.accessories = accessories
    if (customizations) user.avatar.customizations = { ...user.avatar.customizations, ...customizations }
    
    await user.save()
    
    res.json({ avatar: user.avatar })
  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/user/location
// @desc    Update user location
// @access  Private
router.put('/location', auth, async (req, res) => {
  try {
    const { lat, lng, address } = req.body
    
    const user = await User.findById(req.user._id)
    
    user.location.current = {
      lat,
      lng,
      address,
      updatedAt: new Date()
    }
    
    await user.save()
    
    res.json({ location: user.location.current })
  } catch (error) {
    console.error('Update location error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/user/add-xp
// @desc    Add XP to user (for achievements)
// @access  Private
router.post('/add-xp', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body
    
    const user = await User.findById(req.user._id)
    const result = user.addXP(amount)
    
    await user.save()
    
    res.json({
      ...result,
      reason,
      currentLevel: user.gameStats.level,
      currentXP: user.gameStats.xp
    })
  } catch (error) {
    console.error('Add XP error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/user/add-coins
// @desc    Add coins to user
// @access  Private
router.post('/add-coins', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body
    
    const user = await User.findById(req.user._id)
    const newTotal = user.addCoins(amount)
    
    await user.save()
    
    res.json({
      coinsAdded: amount,
      totalCoins: newTotal,
      reason
    })
  } catch (error) {
    console.error('Add coins error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/user/unlock-badge
// @desc    Unlock a badge for user
// @access  Private
router.post('/unlock-badge', auth, async (req, res) => {
  try {
    const { id, name, description, icon } = req.body
    
    const user = await User.findById(req.user._id)
    
    // Check if badge already exists
    const existingBadge = user.gameStats.badges.find(badge => badge.id === id)
    if (existingBadge) {
      return res.status(400).json({ message: 'Badge already unlocked' })
    }
    
    user.gameStats.badges.push({
      id,
      name,
      description,
      icon,
      unlockedAt: new Date()
    })
    
    await user.save()
    
    res.json({
      badge: { id, name, description, icon },
      totalBadges: user.gameStats.badges.length
    })
  } catch (error) {
    console.error('Unlock badge error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/stats
// @desc    Get user game statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('gameStats sustainabilityStats')
    
    res.json({
      gameStats: user.gameStats,
      sustainabilityStats: user.sustainabilityStats
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/public/:userId
// @desc    Get public user profile
// @access  Public
router.get('/public/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    
    if (!user || !user.socialStats.publicProfile) {
      return res.status(404).json({ message: 'User not found or profile is private' })
    }
    
    const publicProfile = user.getPublicProfile()
    res.json({ user: publicProfile })
  } catch (error) {
    console.error('Get public profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/user/search
// @desc    Search users by username
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' })
    }
    
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      'socialStats.publicProfile': true,
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('username avatar gameStats.level gameStats.badges')
    .limit(10)
    
    res.json({ users })
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
