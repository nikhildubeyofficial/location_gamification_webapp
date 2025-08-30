const express = require('express')
const User = require('../models/User')
const Mission = require('../models/Mission')
const Session = require('../models/Session')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/game/profile
// @desc    Get complete game profile data
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    
    // Get active missions
    const activeMissions = await Mission.find({
      'participants.user': req.user._id,
      'participants.status': 'active',
      isActive: true
    }).limit(5)

    // Get recent sessions
    const recentSessions = await Session.find({
      user: req.user._id,
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(5)

    // Calculate additional stats
    const totalSessions = await Session.countDocuments({ user: req.user._id, status: 'completed' })
    const thisWeekSessions = await Session.countDocuments({
      user: req.user._id,
      status: 'completed',
      createdAt: { $gte: getStartOfWeek() }
    })

    const gameProfile = {
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        gameStats: user.gameStats,
        sustainabilityStats: user.sustainabilityStats,
        socialStats: {
          friendsCount: user.socialStats.friends.length,
          friendCode: user.socialStats.friendCode
        }
      },
      activeMissions: activeMissions.map(mission => {
        const participant = mission.participants.find(p => p.user.toString() === req.user._id.toString())
        return {
          _id: mission._id,
          name: mission.name,
          description: mission.description,
          type: mission.type,
          difficulty: mission.difficulty,
          progress: participant.progress,
          completionPercentage: mission.getCompletionPercentage(req.user._id)
        }
      }),
      recentSessions: recentSessions.map(session => ({
        _id: session._id,
        type: session.type,
        duration: session.duration,
        stats: session.stats,
        createdAt: session.createdAt
      })),
      weeklyStats: {
        sessionsThisWeek: thisWeekSessions,
        totalSessions: totalSessions
      }
    }

    res.json(gameProfile)
  } catch (error) {
    console.error('Get game profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/game/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    // Update streak
    user.updateStreak()
    await user.save()

    // Get today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaySessions = await Session.find({
      user: req.user._id,
      createdAt: { $gte: today }
    })

    const todayStats = todaySessions.reduce((acc, session) => {
      acc.steps += session.stats.steps || 0
      acc.distance += session.stats.distance || 0
      acc.activeTime += session.duration || 0
      acc.calories += session.stats.calories || 0
      return acc
    }, { steps: 0, distance: 0, activeTime: 0, calories: 0 })

    // Get quick missions (easy daily missions)
    const quickMissions = await Mission.find({
      category: 'daily',
      difficulty: 'easy',
      isActive: true,
      'participants.user': { $ne: req.user._id }
    }).limit(3)

    // Get recent achievements
    const recentAchievements = user.gameStats.badges
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 3)

    const dashboardData = {
      user: {
        username: user.username,
        level: user.gameStats.level,
        xp: user.gameStats.xp,
        coins: user.gameStats.coins,
        streakDays: user.gameStats.streakDays,
        avatar: user.avatar
      },
      todayStats,
      quickMissions: quickMissions.map(mission => ({
        _id: mission._id,
        name: mission.name,
        description: mission.description,
        rewards: mission.rewards
      })),
      recentAchievements,
      progressToNextLevel: {
        currentXP: user.gameStats.xp,
        nextLevelXP: Math.pow(user.gameStats.level, 2) * 100,
        percentage: (user.gameStats.xp % (Math.pow(user.gameStats.level, 2) * 100)) / (Math.pow(user.gameStats.level, 2) * 100) * 100
      }
    }

    res.json(dashboardData)
  } catch (error) {
    console.error('Get dashboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/game/daily-checkin
// @desc    Perform daily check-in
// @access  Private
router.post('/daily-checkin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    const today = new Date()
    const lastCheckin = user.gameStats.lastActiveDate
    const isNewDay = !lastCheckin || 
                     today.toDateString() !== new Date(lastCheckin).toDateString()

    if (!isNewDay) {
      return res.status(400).json({ message: 'Already checked in today' })
    }

    // Update streak
    const streakDays = user.updateStreak()
    
    // Daily check-in rewards
    let xpReward = 25 + (streakDays * 5) // Base 25 XP + 5 per streak day
    let coinReward = 10 + Math.floor(streakDays / 3) // Base 10 coins + bonus every 3 days

    // Streak bonuses
    let bonusReward = null
    if (streakDays === 7) {
      bonusReward = { type: 'weekly_streak', xp: 100, coins: 50, badge: 'Week Warrior' }
    } else if (streakDays === 30) {
      bonusReward = { type: 'monthly_streak', xp: 500, coins: 200, badge: 'Month Master' }
    } else if (streakDays % 10 === 0) {
      bonusReward = { type: 'milestone_streak', xp: streakDays * 10, coins: streakDays * 5 }
    }

    if (bonusReward) {
      xpReward += bonusReward.xp
      coinReward += bonusReward.coins
      
      if (bonusReward.badge) {
        const badgeExists = user.gameStats.badges.find(b => b.name === bonusReward.badge)
        if (!badgeExists) {
          user.gameStats.badges.push({
            id: bonusReward.type,
            name: bonusReward.badge,
            description: `Maintained ${streakDays} day streak`,
            icon: '🔥',
            unlockedAt: new Date()
          })
        }
      }
    }

    const xpResult = user.addXP(xpReward)
    user.addCoins(coinReward)
    
    await user.save()

    res.json({
      message: 'Daily check-in successful! 🎉',
      streakDays,
      rewards: {
        xp: xpReward,
        coins: coinReward,
        levelUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel
      },
      bonusReward,
      nextCheckinIn: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    })
  } catch (error) {
    console.error('Daily checkin error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/game/achievements
// @desc    Get all available achievements
// @access  Private
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    const allAchievements = [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first 1000 steps',
        icon: '👣',
        category: 'fitness',
        requirement: 'steps',
        target: 1000,
        unlocked: user.gameStats.badges.some(b => b.id === 'first_steps')
      },
      {
        id: 'distance_walker',
        name: 'Distance Walker',
        description: 'Walk 10km in total',
        icon: '🚶',
        category: 'fitness',
        requirement: 'distance',
        target: 10000,
        unlocked: user.gameStats.badges.some(b => b.id === 'distance_walker')
      },
      {
        id: 'eco_warrior',
        name: 'Eco Warrior',
        description: 'Complete first cleanup mission',
        icon: '♻️',
        category: 'sustainability',
        requirement: 'cleanup',
        target: 1,
        unlocked: user.gameStats.badges.some(b => b.id === 'eco_warrior')
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 5 friends',
        icon: '🦋',
        category: 'social',
        requirement: 'friends',
        target: 5,
        unlocked: user.gameStats.badges.some(b => b.id === 'social_butterfly')
      },
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Maintain 7-day streak',
        icon: '🔥',
        category: 'consistency',
        requirement: 'streak',
        target: 7,
        unlocked: user.gameStats.badges.some(b => b.id === 'week_warrior')
      }
    ]

    // Calculate progress for each achievement
    const achievementsWithProgress = allAchievements.map(achievement => {
      let progress = 0
      
      switch (achievement.requirement) {
        case 'steps':
          progress = user.gameStats.totalSteps
          break
        case 'distance':
          progress = user.gameStats.totalDistance
          break
        case 'cleanup':
          progress = user.sustainabilityStats.cleanupMissions
          break
        case 'friends':
          progress = user.socialStats.friends.length
          break
        case 'streak':
          progress = user.gameStats.streakDays
          break
      }

      return {
        ...achievement,
        progress: Math.min(progress, achievement.target),
        percentage: Math.min((progress / achievement.target) * 100, 100)
      }
    })

    res.json({ achievements: achievementsWithProgress })
  } catch (error) {
    console.error('Get achievements error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/game/spin-wheel
// @desc    Spin reward wheel (daily bonus)
// @access  Private
router.post('/spin-wheel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    // Check if user can spin (once per day)
    const today = new Date().toDateString()
    const lastSpin = user.gameStats.lastSpinDate ? new Date(user.gameStats.lastSpinDate).toDateString() : null
    
    if (lastSpin === today) {
      return res.status(400).json({ message: 'Already spun today! Come back tomorrow.' })
    }

    // Define wheel rewards
    const rewards = [
      { type: 'coins', amount: 25, probability: 30 },
      { type: 'coins', amount: 50, probability: 20 },
      { type: 'coins', amount: 100, probability: 10 },
      { type: 'xp', amount: 50, probability: 25 },
      { type: 'xp', amount: 100, probability: 10 },
      { type: 'both', coins: 25, xp: 25, probability: 5 }
    ]

    // Select random reward based on probability
    const random = Math.random() * 100
    let cumulativeProbability = 0
    let selectedReward = rewards[0]

    for (const reward of rewards) {
      cumulativeProbability += reward.probability
      if (random <= cumulativeProbability) {
        selectedReward = reward
        break
      }
    }

    // Apply reward
    let message = 'Congratulations! You won: '
    const rewardResult = {}

    if (selectedReward.type === 'coins') {
      user.addCoins(selectedReward.amount)
      message += `${selectedReward.amount} coins! 🪙`
      rewardResult.coins = selectedReward.amount
    } else if (selectedReward.type === 'xp') {
      const xpResult = user.addXP(selectedReward.amount)
      message += `${selectedReward.amount} XP! ⭐`
      rewardResult.xp = selectedReward.amount
      rewardResult.levelUp = xpResult.leveledUp
    } else if (selectedReward.type === 'both') {
      user.addCoins(selectedReward.coins)
      const xpResult = user.addXP(selectedReward.xp)
      message += `${selectedReward.coins} coins and ${selectedReward.xp} XP! 🎉`
      rewardResult.coins = selectedReward.coins
      rewardResult.xp = selectedReward.xp
      rewardResult.levelUp = xpResult.leveledUp
    }

    user.gameStats.lastSpinDate = new Date()
    await user.save()

    res.json({
      message,
      reward: selectedReward,
      result: rewardResult,
      nextSpinIn: 24 * 60 * 60 * 1000 // 24 hours
    })
  } catch (error) {
    console.error('Spin wheel error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helper function
function getStartOfWeek() {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

module.exports = router
