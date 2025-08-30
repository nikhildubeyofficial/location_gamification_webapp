const express = require('express')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   POST /api/sustainability/plant-tree
// @desc    Plant a virtual tree
// @access  Private
router.post('/plant-tree', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    // Check if user has enough green miles (e.g., 5km = 1 tree)
    const requiredGreenMiles = 5000 // 5km in meters
    
    if (user.sustainabilityStats.greenMiles < requiredGreenMiles) {
      return res.status(400).json({ 
        message: `Need ${requiredGreenMiles/1000}km of green miles to plant a tree. You have ${user.sustainabilityStats.greenMiles/1000}km.`
      })
    }

    // Plant tree and deduct green miles
    user.sustainabilityStats.treesPlanted += 1
    user.sustainabilityStats.greenMiles -= requiredGreenMiles
    user.sustainabilityStats.ecoScore += 100 // Award eco points
    user.sustainabilityStats.carbonSaved += 22 // Average CO2 absorbed by tree per year (kg)

    // Award XP and coins
    const xpResult = user.addXP(50)
    user.addCoins(25)

    await user.save()

    res.json({
      message: 'Virtual tree planted successfully! 🌱',
      treesPlanted: user.sustainabilityStats.treesPlanted,
      ecoScore: user.sustainabilityStats.ecoScore,
      carbonSaved: user.sustainabilityStats.carbonSaved,
      rewards: {
        xp: 50,
        coins: 25,
        levelUp: xpResult.leveledUp
      }
    })
  } catch (error) {
    console.error('Plant tree error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/sustainability/log-green-travel
// @desc    Log eco-friendly travel
// @access  Private
router.post('/log-green-travel', auth, async (req, res) => {
  try {
    const { distance, transportMode, carbonSaved } = req.body

    if (!distance || !transportMode) {
      return res.status(400).json({ message: 'Distance and transport mode are required' })
    }

    const ecoFriendlyModes = ['walking', 'cycling', 'public_transport']
    if (!ecoFriendlyModes.includes(transportMode)) {
      return res.status(400).json({ message: 'Transport mode is not eco-friendly' })
    }

    const user = await User.findById(req.user._id)
    
    // Add to green miles
    user.sustainabilityStats.greenMiles += distance
    user.sustainabilityStats.carbonSaved += carbonSaved || calculateCarbonSaved(distance, transportMode)
    
    // Calculate eco score based on distance and mode
    let ecoPoints = Math.floor(distance / 100) // 1 point per 100m
    if (transportMode === 'cycling') ecoPoints *= 1.5
    else if (transportMode === 'public_transport') ecoPoints *= 1.2
    
    user.sustainabilityStats.ecoScore += ecoPoints

    // Award XP
    const xpGained = Math.floor(distance / 500) // 1 XP per 500m of green travel
    const xpResult = user.addXP(xpGained)

    await user.save()

    res.json({
      message: 'Green travel logged successfully! 🌍',
      distance,
      transportMode,
      ecoPointsGained: ecoPoints,
      totalEcoScore: user.sustainabilityStats.ecoScore,
      totalGreenMiles: user.sustainabilityStats.greenMiles,
      carbonSaved: user.sustainabilityStats.carbonSaved,
      rewards: {
        xp: xpGained,
        levelUp: xpResult.leveledUp
      }
    })
  } catch (error) {
    console.error('Log green travel error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/sustainability/cleanup-mission
// @desc    Complete a cleanup mission
// @access  Private
router.post('/cleanup-mission', auth, async (req, res) => {
  try {
    const { location, photoUrl, description, itemsCollected } = req.body

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Location is required' })
    }

    const user = await User.findById(req.user._id)
    
    // Award points for cleanup
    user.sustainabilityStats.cleanupMissions += 1
    user.sustainabilityStats.ecoScore += 200 // Cleanup missions are worth more
    user.sustainabilityStats.carbonSaved += 5 // Estimated impact

    // Award XP and coins
    const xpResult = user.addXP(100)
    user.addCoins(50)

    // Check for cleanup badges
    const cleanupCount = user.sustainabilityStats.cleanupMissions
    let newBadge = null

    if (cleanupCount === 1) {
      newBadge = {
        id: 'first_cleanup',
        name: 'Eco Warrior',
        description: 'Completed first cleanup mission',
        icon: '♻️'
      }
    } else if (cleanupCount === 10) {
      newBadge = {
        id: 'cleanup_champion',
        name: 'Cleanup Champion',
        description: 'Completed 10 cleanup missions',
        icon: '🌟'
      }
    }

    if (newBadge && !user.gameStats.badges.find(b => b.id === newBadge.id)) {
      user.gameStats.badges.push({
        ...newBadge,
        unlockedAt: new Date()
      })
    }

    await user.save()

    res.json({
      message: 'Cleanup mission completed! Thank you for making the world cleaner! 🌍',
      cleanupMissions: user.sustainabilityStats.cleanupMissions,
      ecoScore: user.sustainabilityStats.ecoScore,
      rewards: {
        xp: 100,
        coins: 50,
        levelUp: xpResult.leveledUp,
        badge: newBadge
      }
    })
  } catch (error) {
    console.error('Cleanup mission error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/sustainability/stats
// @desc    Get user's sustainability statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    const stats = {
      ...user.sustainabilityStats,
      greenMilesKm: Math.round(user.sustainabilityStats.greenMiles / 1000 * 100) / 100,
      canPlantTree: user.sustainabilityStats.greenMiles >= 5000,
      nextTreeAt: 5000 - (user.sustainabilityStats.greenMiles % 5000),
      ecoLevel: Math.floor(user.sustainabilityStats.ecoScore / 1000) + 1,
      impact: {
        treesEquivalent: Math.floor(user.sustainabilityStats.carbonSaved / 22),
        carsOffRoad: Math.floor(user.sustainabilityStats.carbonSaved / 4600), // Average car emissions per year
        plasticBottlesSaved: user.sustainabilityStats.cleanupMissions * 10 // Estimate
      }
    }

    res.json({ stats })
  } catch (error) {
    console.error('Get sustainability stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/sustainability/leaderboard
// @desc    Get sustainability leaderboard
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { type = 'ecoScore' } = req.query

    let sortField = 'sustainabilityStats.ecoScore'
    if (type === 'trees') sortField = 'sustainabilityStats.treesPlanted'
    else if (type === 'greenMiles') sortField = 'sustainabilityStats.greenMiles'
    else if (type === 'cleanup') sortField = 'sustainabilityStats.cleanupMissions'

    const users = await User.find({})
      .select('username avatar sustainabilityStats')
      .sort({ [sortField]: -1 })
      .limit(50)

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar
      },
      stats: user.sustainabilityStats,
      score: type === 'trees' ? user.sustainabilityStats.treesPlanted :
             type === 'greenMiles' ? Math.round(user.sustainabilityStats.greenMiles / 1000) :
             type === 'cleanup' ? user.sustainabilityStats.cleanupMissions :
             user.sustainabilityStats.ecoScore
    }))

    // Find current user's position
    const userPosition = leaderboard.findIndex(entry => entry.user._id.toString() === req.user._id.toString()) + 1

    res.json({
      leaderboard,
      userPosition: userPosition || null,
      type
    })
  } catch (error) {
    console.error('Get sustainability leaderboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/sustainability/challenges
// @desc    Get sustainability challenges
// @access  Private
router.get('/challenges', auth, async (req, res) => {
  try {
    const challenges = [
      {
        id: 'weekly_green_commute',
        name: 'Green Commuter',
        description: 'Travel 25km using eco-friendly transport this week',
        type: 'weekly',
        target: 25000, // meters
        reward: { xp: 200, coins: 100, badge: 'Green Commuter' },
        progress: 0, // Would be calculated from user data
        deadline: getEndOfWeek()
      },
      {
        id: 'monthly_tree_planter',
        name: 'Forest Guardian',
        description: 'Plant 5 virtual trees this month',
        type: 'monthly',
        target: 5,
        reward: { xp: 500, coins: 250, badge: 'Forest Guardian' },
        progress: 0,
        deadline: getEndOfMonth()
      },
      {
        id: 'cleanup_hero',
        name: 'Cleanup Hero',
        description: 'Complete 3 cleanup missions',
        type: 'ongoing',
        target: 3,
        reward: { xp: 300, coins: 150, badge: 'Cleanup Hero' },
        progress: 0
      }
    ]

    // In a real implementation, you'd calculate actual progress from user data
    const user = await User.findById(req.user._id)
    challenges[0].progress = user.sustainabilityStats.greenMiles
    challenges[1].progress = user.sustainabilityStats.treesPlanted
    challenges[2].progress = user.sustainabilityStats.cleanupMissions

    res.json({ challenges })
  } catch (error) {
    console.error('Get sustainability challenges error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helper functions
function calculateCarbonSaved(distance, transportMode) {
  // Rough estimates of CO2 saved compared to car travel (kg CO2 per km)
  const carEmission = 0.21 // kg CO2 per km for average car
  const distanceKm = distance / 1000

  switch (transportMode) {
    case 'walking':
    case 'cycling':
      return Math.round(carEmission * distanceKm * 100) / 100 // Full savings
    case 'public_transport':
      return Math.round(carEmission * distanceKm * 0.6 * 100) / 100 // 60% savings
    default:
      return 0
  }
}

function getEndOfWeek() {
  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
  endOfWeek.setHours(23, 59, 59, 999)
  return endOfWeek
}

function getEndOfMonth() {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)
  return endOfMonth
}

module.exports = router
