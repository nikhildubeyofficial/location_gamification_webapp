const mongoose = require('mongoose')

const missionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['fitness', 'social', 'sustainability', 'exploration', 'challenge'],
    required: true
  },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special', 'achievement'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'legendary'],
    default: 'easy'
  },
  requirements: {
    steps: Number,
    distance: Number, // in meters
    activeTime: Number, // in minutes
    locations: [{
      name: String,
      lat: Number,
      lng: Number,
      radius: Number // geofence radius in meters
    }],
    friends: Number, // number of friends required
    streakDays: Number,
    customGoal: String
  },
  rewards: {
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    badge: {
      id: String,
      name: String,
      description: String,
      icon: String
    },
    items: [String] // avatar accessories, etc.
  },
  timeLimit: {
    duration: Number, // in hours
    expiresAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGlobal: {
    type: Boolean,
    default: true // Available to all users
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: {
      steps: { type: Number, default: 0 },
      distance: { type: Number, default: 0 },
      activeTime: { type: Number, default: 0 },
      locationsVisited: [String],
      friendsInvited: { type: Number, default: 0 },
      customProgress: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'abandoned'],
      default: 'active'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date
  }],
  metadata: {
    totalParticipants: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageCompletionTime: Number // in hours
  }
}, {
  timestamps: true
})

// Calculate completion percentage for a user
missionSchema.methods.getCompletionPercentage = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString())
  if (!participant) return 0

  const progress = participant.progress
  const requirements = this.requirements
  let totalProgress = 0
  let totalRequirements = 0

  // Check each requirement type
  if (requirements.steps) {
    totalProgress += Math.min(progress.steps / requirements.steps, 1)
    totalRequirements += 1
  }
  
  if (requirements.distance) {
    totalProgress += Math.min(progress.distance / requirements.distance, 1)
    totalRequirements += 1
  }
  
  if (requirements.activeTime) {
    totalProgress += Math.min(progress.activeTime / requirements.activeTime, 1)
    totalRequirements += 1
  }
  
  if (requirements.locations && requirements.locations.length > 0) {
    const locationsVisited = progress.locationsVisited.length
    totalProgress += Math.min(locationsVisited / requirements.locations.length, 1)
    totalRequirements += 1
  }
  
  if (requirements.friends) {
    totalProgress += Math.min(progress.friendsInvited / requirements.friends, 1)
    totalRequirements += 1
  }

  return totalRequirements > 0 ? (totalProgress / totalRequirements) * 100 : 0
}

// Check if mission is completed for a user
missionSchema.methods.isCompletedByUser = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString())
  if (!participant) return false

  const progress = participant.progress
  const requirements = this.requirements

  // Check all requirements
  if (requirements.steps && progress.steps < requirements.steps) return false
  if (requirements.distance && progress.distance < requirements.distance) return false
  if (requirements.activeTime && progress.activeTime < requirements.activeTime) return false
  if (requirements.locations && progress.locationsVisited.length < requirements.locations.length) return false
  if (requirements.friends && progress.friendsInvited < requirements.friends) return false
  if (requirements.streakDays && progress.streakDays < requirements.streakDays) return false

  return true
}

// Update user progress
missionSchema.methods.updateProgress = function(userId, progressData) {
  let participant = this.participants.find(p => p.user.toString() === userId.toString())
  
  if (!participant) {
    participant = {
      user: userId,
      progress: {
        steps: 0,
        distance: 0,
        activeTime: 0,
        locationsVisited: [],
        friendsInvited: 0
      },
      status: 'active',
      startedAt: new Date()
    }
    this.participants.push(participant)
  }

  // Update progress
  Object.keys(progressData).forEach(key => {
    if (key === 'locationsVisited' && Array.isArray(progressData[key])) {
      participant.progress.locationsVisited = [...new Set([...participant.progress.locationsVisited, ...progressData[key]])]
    } else if (typeof progressData[key] === 'number') {
      participant.progress[key] = Math.max(participant.progress[key] || 0, progressData[key])
    } else {
      participant.progress[key] = progressData[key]
    }
  })

  // Check if completed
  if (this.isCompletedByUser(userId) && participant.status === 'active') {
    participant.status = 'completed'
    participant.completedAt = new Date()
  }

  return participant
}

// Get leaderboard for this mission
missionSchema.methods.getLeaderboard = function() {
  return this.participants
    .filter(p => p.status !== 'abandoned')
    .map(p => ({
      user: p.user,
      progress: p.progress,
      status: p.status,
      completionPercentage: this.getCompletionPercentage(p.user),
      completedAt: p.completedAt
    }))
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return -1
      if (b.status === 'completed' && a.status !== 'completed') return 1
      if (a.status === 'completed' && b.status === 'completed') {
        return new Date(a.completedAt) - new Date(b.completedAt)
      }
      return b.completionPercentage - a.completionPercentage
    })
}

module.exports = mongoose.model('Mission', missionSchema)
