import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const GameContext = createContext()

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    stats: {
      steps: 0,
      distance: 0,
      activeTime: 0,
      level: 1,
      xp: 0,
      coins: 0,
      streakDays: 0
    },
    badges: [],
    activeMissions: [],
    completedMissions: [],
    friends: [],
    leaderboard: [],
    sustainabilityStats: {
      treesPlanted: 0,
      greenMiles: 0,
      ecoScore: 0
    },
    avatar: {
      model: 'default',
      color: '#3B82F6',
      accessories: []
    }
  })

  const [currentSession, setCurrentSession] = useState(null)
  const [isTracking, setIsTracking] = useState(false)

  // Fetch user game data
  const fetchGameData = async () => {
    try {
      const response = await axios.get('/api/game/profile')
      setGameState(response.data)
    } catch (error) {
      console.error('Failed to fetch game data:', error)
    }
  }

  // Start fitness tracking session
  const startFitnessSession = async () => {
    try {
      const response = await axios.post('/api/fitness/start')
      setCurrentSession(response.data.session)
      setIsTracking(true)
      toast.success('Fitness tracking started!')
      return response.data.session
    } catch (error) {
      toast.error('Failed to start tracking')
      console.error(error)
    }
  }

  // Update fitness session
  const updateFitnessSession = async (data) => {
    if (!currentSession) return

    try {
      const response = await axios.put(`/api/fitness/update/${currentSession._id}`, data)
      setCurrentSession(response.data.session)
      
      // Update game stats
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          steps: response.data.session.steps,
          distance: response.data.session.distance,
          activeTime: response.data.session.duration
        }
      }))
    } catch (error) {
      console.error('Failed to update session:', error)
    }
  }

  // Stop fitness tracking
  const stopFitnessSession = async () => {
    if (!currentSession) return

    try {
      const response = await axios.post(`/api/fitness/stop/${currentSession._id}`)
      setCurrentSession(null)
      setIsTracking(false)
      
      // Check for achievements
      if (response.data.achievements?.length > 0) {
        response.data.achievements.forEach(achievement => {
          toast.success(`🏆 Achievement unlocked: ${achievement.name}!`)
        })
      }
      
      toast.success('Session completed!')
      await fetchGameData() // Refresh game data
    } catch (error) {
      toast.error('Failed to stop tracking')
      console.error(error)
    }
  }

  // Complete mission
  const completeMission = async (missionId, data = {}) => {
    try {
      const response = await axios.post(`/api/missions/complete/${missionId}`, data)
      
      // Update missions
      setGameState(prev => ({
        ...prev,
        activeMissions: prev.activeMissions.filter(m => m._id !== missionId),
        completedMissions: [...prev.completedMissions, response.data.mission]
      }))

      // Show rewards
      if (response.data.rewards) {
        const { xp, coins, badge } = response.data.rewards
        if (xp) toast.success(`+${xp} XP earned!`)
        if (coins) toast.success(`+${coins} coins earned!`)
        if (badge) toast.success(`🏅 Badge earned: ${badge.name}!`)
      }

      await fetchGameData()
    } catch (error) {
      toast.error('Failed to complete mission')
      console.error(error)
    }
  }

  // Update avatar
  const updateAvatar = async (avatarData) => {
    try {
      const response = await axios.put('/api/user/avatar', avatarData)
      setGameState(prev => ({
        ...prev,
        avatar: response.data.avatar
      }))
      toast.success('Avatar updated!')
    } catch (error) {
      toast.error('Failed to update avatar')
      console.error(error)
    }
  }

  // Add friend
  const addFriend = async (friendCode) => {
    try {
      const response = await axios.post('/api/social/add-friend', { friendCode })
      setGameState(prev => ({
        ...prev,
        friends: [...prev.friends, response.data.friend]
      }))
      toast.success(`${response.data.friend.username} added as friend!`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add friend')
    }
  }

  // Fetch leaderboard
  const fetchLeaderboard = async (type = 'weekly') => {
    try {
      const response = await axios.get(`/api/leaderboard?type=${type}`)
      setGameState(prev => ({
        ...prev,
        leaderboard: response.data.leaderboard
      }))
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  // Plant virtual tree
  const plantTree = async () => {
    try {
      const response = await axios.post('/api/sustainability/plant-tree')
      setGameState(prev => ({
        ...prev,
        sustainabilityStats: {
          ...prev.sustainabilityStats,
          treesPlanted: response.data.treesPlanted
        }
      }))
      toast.success('🌱 Virtual tree planted!')
    } catch (error) {
      toast.error('Not enough green miles to plant a tree')
    }
  }

  const value = {
    gameState,
    currentSession,
    isTracking,
    fetchGameData,
    startFitnessSession,
    updateFitnessSession,
    stopFitnessSession,
    completeMission,
    updateAvatar,
    addFriend,
    fetchLeaderboard,
    plantTree
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}
