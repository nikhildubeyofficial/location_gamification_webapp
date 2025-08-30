const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: String,
    lastName: String,
    age: Number,
    height: Number, // in cm
    weight: Number, // in kg
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    goals: [{
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness', 'sustainability']
    }]
  },
  gameStats: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 100 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    totalSteps: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in meters
    totalActiveTime: { type: Number, default: 0 }, // in minutes
    badges: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      unlockedAt: { type: Date, default: Date.now }
    }]
  },
  avatar: {
    model: { type: String, default: 'default' },
    color: { type: String, default: '#3B82F6' },
    accessories: [String],
    customizations: {
      hair: String,
      outfit: String,
      shoes: String
    }
  },
  socialStats: {
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendCode: { type: String, unique: true },
    publicProfile: { type: Boolean, default: true }
  },
  sustainabilityStats: {
    treesPlanted: { type: Number, default: 0 },
    greenMiles: { type: Number, default: 0 }, // eco-friendly travel distance
    ecoScore: { type: Number, default: 0 },
    carbonSaved: { type: Number, default: 0 }, // in kg CO2
    cleanupMissions: { type: Number, default: 0 }
  },
  preferences: {
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    notifications: {
      missions: { type: Boolean, default: true },
      friends: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true }
    },
    privacy: {
      shareLocation: { type: Boolean, default: false },
      shareStats: { type: Boolean, default: true }
    }
  },
  location: {
    current: {
      lat: Number,
      lng: Number,
      address: String,
      updatedAt: Date
    },
    homeBase: {
      lat: Number,
      lng: Number,
      address: String
    }
  }
}, {
  timestamps: true
})

// Generate unique friend code before saving
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.socialStats.friendCode) {
    let friendCode
    let isUnique = false
    
    while (!isUnique) {
      friendCode = Math.random().toString(36).substr(2, 8).toUpperCase()
      const existingUser = await mongoose.model('User').findOne({ 'socialStats.friendCode': friendCode })
      if (!existingUser) {
        isUnique = true
      }
    }
    
    this.socialStats.friendCode = friendCode
  }
  next()
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Calculate level based on XP
userSchema.methods.calculateLevel = function() {
  const xp = this.gameStats.xp
  const level = Math.floor(Math.sqrt(xp / 100)) + 1
  this.gameStats.level = level
  return level
}

// Add XP and check for level up
userSchema.methods.addXP = function(amount) {
  const oldLevel = this.gameStats.level
  this.gameStats.xp += amount
  const newLevel = this.calculateLevel()
  
  return {
    xpGained: amount,
    leveledUp: newLevel > oldLevel,
    newLevel: newLevel,
    totalXP: this.gameStats.xp
  }
}

// Add coins
userSchema.methods.addCoins = function(amount) {
  this.gameStats.coins += amount
  return this.gameStats.coins
}

// Update streak
userSchema.methods.updateStreak = function() {
  const today = new Date()
  const lastActive = new Date(this.gameStats.lastActiveDate)
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 1) {
    // Continue streak
    this.gameStats.streakDays += 1
  } else if (daysDiff > 1) {
    // Reset streak
    this.gameStats.streakDays = 1
  }
  // If daysDiff === 0, same day, no change needed
  
  this.gameStats.lastActiveDate = today
  return this.gameStats.streakDays
}

// Get public profile data
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    avatar: this.avatar,
    gameStats: {
      level: this.gameStats.level,
      xp: this.gameStats.xp,
      badges: this.gameStats.badges
    },
    sustainabilityStats: this.sustainabilityStats
  }
}

module.exports = mongoose.model('User', userSchema)
