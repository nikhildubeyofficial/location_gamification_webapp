const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['walking', 'running', 'cycling', 'hiking', 'workout', 'other'],
    default: 'walking'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number,
    default: 0 // in minutes
  },
  stats: {
    steps: { type: Number, default: 0 },
    distance: { type: Number, default: 0 }, // in meters
    calories: { type: Number, default: 0 },
    avgSpeed: { type: Number, default: 0 }, // km/h
    maxSpeed: { type: Number, default: 0 }, // km/h
    elevationGain: { type: Number, default: 0 } // in meters
  },
  route: {
    startLocation: {
      lat: Number,
      lng: Number,
      address: String
    },
    endLocation: {
      lat: Number,
      lng: Number,
      address: String
    },
    waypoints: [{
      lat: Number,
      lng: Number,
      timestamp: Date,
      accuracy: Number,
      speed: Number,
      heading: Number
    }],
    snapToRoadPoints: [{
      lat: Number,
      lng: Number,
      originalIndex: Number
    }]
  },
  achievements: [{
    type: String,
    name: String,
    description: String,
    xpReward: Number,
    coinReward: Number,
    unlockedAt: { type: Date, default: Date.now }
  }],
  missions: [{
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
    progressContribution: {
      steps: Number,
      distance: Number,
      activeTime: Number,
      locationsVisited: [String]
    }
  }],
  geofences: [{
    id: String,
    name: String,
    enteredAt: Date,
    exitedAt: Date,
    timeSpent: Number // in minutes
  }],
  socialInteractions: {
    friendsEncountered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    groupSession: {
      isGroup: { type: Boolean, default: false },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      groupCode: String
    }
  },
  sustainability: {
    transportMode: {
      type: String,
      enum: ['walking', 'cycling', 'public_transport', 'car', 'other'],
      default: 'walking'
    },
    carbonSaved: { type: Number, default: 0 }, // kg CO2
    isEcoFriendly: { type: Boolean, default: true }
  },
  weather: {
    temperature: Number,
    humidity: Number,
    conditions: String,
    windSpeed: Number
  },
  notes: String,
  photos: [{
    url: String,
    location: {
      lat: Number,
      lng: Number
    },
    caption: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

// Calculate session statistics
sessionSchema.methods.calculateStats = function() {
  if (this.route.waypoints.length < 2) return

  let totalDistance = 0
  let totalTime = 0
  let speeds = []

  for (let i = 1; i < this.route.waypoints.length; i++) {
    const prev = this.route.waypoints[i - 1]
    const curr = this.route.waypoints[i]

    // Calculate distance between points
    const distance = this.calculateDistance(prev, curr)
    totalDistance += distance

    // Calculate time difference
    const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / 1000 / 60 // minutes
    totalTime += timeDiff

    // Calculate speed
    if (timeDiff > 0) {
      const speed = (distance / 1000) / (timeDiff / 60) // km/h
      speeds.push(speed)
    }
  }

  this.stats.distance = totalDistance
  this.duration = totalTime
  this.stats.avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
  this.stats.maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0

  // Estimate calories (rough calculation)
  const weightKg = 70 // Default weight, should come from user profile
  const met = this.type === 'running' ? 8 : this.type === 'cycling' ? 6 : 3.5 // walking
  this.stats.calories = Math.round((met * weightKg * (totalTime / 60)))

  // Estimate steps (rough calculation for walking/running)
  if (this.type === 'walking' || this.type === 'running') {
    const avgStepLength = 0.7 // meters
    this.stats.steps = Math.round(totalDistance / avgStepLength)
  }
}

// Calculate distance between two points using Haversine formula
sessionSchema.methods.calculateDistance = function(point1, point2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = point1.lat * Math.PI/180
  const φ2 = point2.lat * Math.PI/180
  const Δφ = (point2.lat - point1.lat) * Math.PI/180
  const Δλ = (point2.lng - point1.lng) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

// Add waypoint to route
sessionSchema.methods.addWaypoint = function(waypoint) {
  this.route.waypoints.push({
    ...waypoint,
    timestamp: waypoint.timestamp || new Date()
  })

  // Recalculate stats
  this.calculateStats()
}

// Complete session
sessionSchema.methods.complete = function() {
  this.status = 'completed'
  this.endTime = new Date()
  
  if (this.startTime && this.endTime) {
    this.duration = (this.endTime - this.startTime) / 1000 / 60 // minutes
  }

  this.calculateStats()
}

// Check for achievements
sessionSchema.methods.checkAchievements = function() {
  const achievements = []

  // Distance achievements
  if (this.stats.distance >= 1000 && this.stats.distance < 5000) {
    achievements.push({
      type: 'distance',
      name: 'First Kilometer',
      description: 'Completed your first 1km!',
      xpReward: 50,
      coinReward: 10
    })
  } else if (this.stats.distance >= 5000) {
    achievements.push({
      type: 'distance',
      name: 'Distance Warrior',
      description: 'Completed 5km in a single session!',
      xpReward: 200,
      coinReward: 50
    })
  }

  // Time achievements
  if (this.duration >= 30 && this.duration < 60) {
    achievements.push({
      type: 'time',
      name: 'Half Hour Hero',
      description: 'Stayed active for 30 minutes!',
      xpReward: 75,
      coinReward: 15
    })
  } else if (this.duration >= 60) {
    achievements.push({
      type: 'time',
      name: 'Endurance Champion',
      description: 'Stayed active for over an hour!',
      xpReward: 150,
      coinReward: 30
    })
  }

  // Speed achievements
  if (this.stats.maxSpeed >= 15 && this.type === 'running') {
    achievements.push({
      type: 'speed',
      name: 'Speed Demon',
      description: 'Reached 15+ km/h while running!',
      xpReward: 100,
      coinReward: 25
    })
  }

  this.achievements = achievements
  return achievements
}

module.exports = mongoose.model('Session', sessionSchema)
