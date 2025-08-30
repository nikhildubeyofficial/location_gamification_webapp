const mongoose = require('mongoose')

const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all_time', 'mission_specific'],
    required: true
  },
  category: {
    type: String,
    enum: ['steps', 'distance', 'active_time', 'xp', 'eco_score', 'missions_completed'],
    required: true
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  entries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rank: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    metadata: {
      steps: Number,
      distance: Number,
      activeTime: Number,
      xp: Number,
      level: Number,
      badges: Number,
      treesPlanted: Number,
      missionsCompleted: Number,
      streakDays: Number
    },
    change: {
      type: String,
      enum: ['up', 'down', 'same', 'new'],
      default: 'new'
    },
    previousRank: Number
  }],
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Update leaderboard entries
leaderboardSchema.methods.updateEntries = async function(users) {
  const previousEntries = new Map(this.entries.map(entry => [entry.user.toString(), entry]))
  const newEntries = []

  users.forEach((user, index) => {
    const userId = user._id.toString()
    const previousEntry = previousEntries.get(userId)
    const previousRank = previousEntry ? previousEntry.rank : null

    let change = 'new'
    if (previousRank !== null) {
      if (index + 1 < previousRank) change = 'up'
      else if (index + 1 > previousRank) change = 'down'
      else change = 'same'
    }

    let score = 0
    const metadata = {
      steps: user.gameStats.totalSteps,
      distance: user.gameStats.totalDistance,
      activeTime: user.gameStats.totalActiveTime,
      xp: user.gameStats.xp,
      level: user.gameStats.level,
      badges: user.gameStats.badges.length,
      treesPlanted: user.sustainabilityStats.treesPlanted,
      missionsCompleted: 0, // This would be calculated from missions
      streakDays: user.gameStats.streakDays
    }

    // Calculate score based on category
    switch (this.category) {
      case 'steps':
        score = user.gameStats.totalSteps
        break
      case 'distance':
        score = user.gameStats.totalDistance
        break
      case 'active_time':
        score = user.gameStats.totalActiveTime
        break
      case 'xp':
        score = user.gameStats.xp
        break
      case 'eco_score':
        score = user.sustainabilityStats.ecoScore
        break
      default:
        score = user.gameStats.xp
    }

    newEntries.push({
      user: user._id,
      rank: index + 1,
      score: score,
      metadata: metadata,
      change: change,
      previousRank: previousRank
    })
  })

  this.entries = newEntries
  this.lastUpdated = new Date()
  return this
}

// Get top N users
leaderboardSchema.methods.getTop = function(n = 10) {
  return this.entries
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n)
}

// Get user's position
leaderboardSchema.methods.getUserPosition = function(userId) {
  return this.entries.find(entry => entry.user.toString() === userId.toString())
}

// Get users around a specific rank
leaderboardSchema.methods.getUsersAround = function(userId, range = 5) {
  const userEntry = this.getUserPosition(userId)
  if (!userEntry) return []

  const startRank = Math.max(1, userEntry.rank - range)
  const endRank = userEntry.rank + range

  return this.entries
    .filter(entry => entry.rank >= startRank && entry.rank <= endRank)
    .sort((a, b) => a.rank - b.rank)
}

// Static method to create or update leaderboard
leaderboardSchema.statics.createOrUpdate = async function(type, category, users, options = {}) {
  const { missionId, startDate, endDate } = options

  let leaderboard = await this.findOne({
    type,
    category,
    missionId: missionId || { $exists: false },
    isActive: true
  })

  if (!leaderboard) {
    leaderboard = new this({
      type,
      category,
      missionId,
      period: { startDate, endDate },
      entries: []
    })
  }

  await leaderboard.updateEntries(users)
  return leaderboard.save()
}

// Static method to get current leaderboards
leaderboardSchema.statics.getCurrentLeaderboards = async function() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    daily: await this.find({
      type: 'daily',
      'period.startDate': { $gte: startOfDay },
      isActive: true
    }).populate('entries.user', 'username avatar gameStats'),
    
    weekly: await this.find({
      type: 'weekly',
      'period.startDate': { $gte: startOfWeek },
      isActive: true
    }).populate('entries.user', 'username avatar gameStats'),
    
    monthly: await this.find({
      type: 'monthly',
      'period.startDate': { $gte: startOfMonth },
      isActive: true
    }).populate('entries.user', 'username avatar gameStats'),
    
    allTime: await this.find({
      type: 'all_time',
      isActive: true
    }).populate('entries.user', 'username avatar gameStats')
  }
}

module.exports = mongoose.model('Leaderboard', leaderboardSchema)
