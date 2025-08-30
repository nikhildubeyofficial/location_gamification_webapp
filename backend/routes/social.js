const express = require('express')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @route   POST /api/social/add-friend
// @desc    Add friend by friend code
// @access  Private
router.post('/add-friend', auth, async (req, res) => {
  try {
    const { friendCode } = req.body

    if (!friendCode) {
      return res.status(400).json({ message: 'Friend code is required' })
    }

    // Find friend by friend code
    const friend = await User.findOne({ 'socialStats.friendCode': friendCode })
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found with this code' })
    }

    // Check if trying to add self
    if (friend._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as friend' })
    }

    // Check if already friends
    const user = await User.findById(req.user._id)
    if (user.socialStats.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'Already friends with this user' })
    }

    // Add to both users' friend lists
    user.socialStats.friends.push(friend._id)
    friend.socialStats.friends.push(user._id)

    await user.save()
    await friend.save()

    res.json({
      message: 'Friend added successfully',
      friend: {
        _id: friend._id,
        username: friend.username,
        avatar: friend.avatar,
        gameStats: {
          level: friend.gameStats.level,
          xp: friend.gameStats.xp
        }
      }
    })
  } catch (error) {
    console.error('Add friend error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/social/friends
// @desc    Get user's friends list
// @access  Private
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('socialStats.friends', 'username avatar gameStats.level gameStats.xp gameStats.badges location.current')

    const friends = user.socialStats.friends.map(friend => ({
      _id: friend._id,
      username: friend.username,
      avatar: friend.avatar,
      level: friend.gameStats.level,
      xp: friend.gameStats.xp,
      badges: friend.gameStats.badges.length,
      location: friend.location.current,
      isOnline: friend.location.current && 
                new Date() - new Date(friend.location.current.updatedAt) < 5 * 60 * 1000 // 5 minutes
    }))

    res.json({ friends })
  } catch (error) {
    console.error('Get friends error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/social/remove-friend/:friendId
// @desc    Remove friend
// @access  Private
router.delete('/remove-friend/:friendId', auth, async (req, res) => {
  try {
    const friendId = req.params.friendId

    const user = await User.findById(req.user._id)
    const friend = await User.findById(friendId)

    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' })
    }

    // Remove from both users' friend lists
    user.socialStats.friends = user.socialStats.friends.filter(id => id.toString() !== friendId)
    friend.socialStats.friends = friend.socialStats.friends.filter(id => id.toString() !== req.user._id.toString())

    await user.save()
    await friend.save()

    res.json({ message: 'Friend removed successfully' })
  } catch (error) {
    console.error('Remove friend error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/social/friend-code
// @desc    Get user's friend code
// @access  Private
router.get('/friend-code', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ friendCode: user.socialStats.friendCode })
  } catch (error) {
    console.error('Get friend code error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/social/share-location
// @desc    Share current location with friends
// @access  Private
router.post('/share-location', auth, async (req, res) => {
  try {
    const { lat, lng, address, shareWith } = req.body

    const user = await User.findById(req.user._id)
    
    // Update user's location
    user.location.current = {
      lat,
      lng,
      address,
      updatedAt: new Date()
    }

    await user.save()

    // If specific friends are mentioned, you could implement notifications here
    // For now, we'll just update the location

    res.json({
      message: 'Location shared successfully',
      location: user.location.current
    })
  } catch (error) {
    console.error('Share location error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/social/nearby-friends
// @desc    Get nearby friends
// @access  Private
router.get('/nearby-friends', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query // radius in meters

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location coordinates required' })
    }

    const user = await User.findById(req.user._id)
      .populate('socialStats.friends', 'username avatar gameStats location')

    const nearbyFriends = user.socialStats.friends.filter(friend => {
      if (!friend.location.current || !friend.location.current.lat || !friend.location.current.lng) {
        return false
      }

      // Calculate distance using Haversine formula
      const R = 6371e3 // Earth's radius in meters
      const φ1 = parseFloat(lat) * Math.PI/180
      const φ2 = friend.location.current.lat * Math.PI/180
      const Δφ = (friend.location.current.lat - parseFloat(lat)) * Math.PI/180
      const Δλ = (friend.location.current.lng - parseFloat(lng)) * Math.PI/180

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      const distance = R * c

      return distance <= radius
    }).map(friend => ({
      _id: friend._id,
      username: friend.username,
      avatar: friend.avatar,
      level: friend.gameStats.level,
      location: friend.location.current,
      distance: calculateDistance(lat, lng, friend.location.current.lat, friend.location.current.lng)
    }))

    res.json({ nearbyFriends })
  } catch (error) {
    console.error('Get nearby friends error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/social/create-group-session
// @desc    Create a group fitness session
// @access  Private
router.post('/create-group-session', auth, async (req, res) => {
  try {
    const { name, description, invitedFriends, location } = req.body

    // Generate unique group code
    const groupCode = Math.random().toString(36).substr(2, 8).toUpperCase()

    // For now, we'll store this in a simple format
    // In a full implementation, you'd have a separate GroupSession model
    const groupSession = {
      id: Date.now().toString(),
      name,
      description,
      creator: req.user._id,
      participants: [req.user._id],
      invitedFriends: invitedFriends || [],
      location,
      groupCode,
      status: 'active',
      createdAt: new Date()
    }

    // In a real app, you'd save this to a GroupSession collection
    // and send notifications to invited friends

    res.status(201).json({
      message: 'Group session created successfully',
      groupSession
    })
  } catch (error) {
    console.error('Create group session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/social/join-group-session
// @desc    Join a group session by code
// @access  Private
router.post('/join-group-session', auth, async (req, res) => {
  try {
    const { groupCode } = req.body

    // In a real implementation, you'd find the group session by code
    // For now, we'll simulate this
    res.json({
      message: 'Joined group session successfully',
      groupCode
    })
  } catch (error) {
    console.error('Join group session error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/social/activity-feed
// @desc    Get friends' activity feed
// @access  Private
router.get('/activity-feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const user = await User.findById(req.user._id)
    const friendIds = user.socialStats.friends

    // In a real implementation, you'd have an Activity model
    // For now, we'll simulate recent activities
    const activities = [
      {
        id: '1',
        user: { username: 'john_runner', avatar: { color: '#3B82F6' } },
        type: 'mission_completed',
        description: 'completed the "Distance Walker" mission',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        data: { missionName: 'Distance Walker', xpGained: 100 }
      },
      {
        id: '2',
        user: { username: 'fitness_sarah', avatar: { color: '#EF4444' } },
        type: 'level_up',
        description: 'reached level 5!',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        data: { newLevel: 5 }
      },
      {
        id: '3',
        user: { username: 'eco_warrior', avatar: { color: '#10B981' } },
        type: 'badge_unlocked',
        description: 'unlocked the "Green Commuter" badge',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        data: { badgeName: 'Green Commuter' }
      }
    ]

    res.json({
      activities,
      pagination: {
        current: page,
        pages: 1,
        total: activities.length
      }
    })
  } catch (error) {
    console.error('Get activity feed error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2 - lat1) * Math.PI/180
  const Δλ = (lng2 - lng1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return Math.round(R * c) // Distance in meters
}

module.exports = router
