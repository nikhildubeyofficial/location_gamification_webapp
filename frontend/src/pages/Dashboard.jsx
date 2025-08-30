import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Trophy, 
  Target, 
  Zap, 
  Coins, 
  TrendingUp,
  MapPin,
  Users,
  Leaf,
  Calendar,
  Gift
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import Avatar3D from '../components/Avatar3D'
import StatsCard from '../components/StatsCard'
import MissionCard from '../components/MissionCard'
import AchievementBadge from '../components/AchievementBadge'

const Dashboard = () => {
  const { user } = useAuth()
  const { gameState, isTracking, startFitnessSession, stopFitnessSession, fetchGameData } = useGame()
  const [todayStats, setTodayStats] = useState({
    steps: 1247,
    distance: 0.8,
    activeTime: 23,
    calories: 89
  })
  const [quickMissions, setQuickMissions] = useState([])
  const [recentAchievements, setRecentAchievements] = useState([])

  useEffect(() => {
    fetchGameData()
    // Simulate some data for demo
    setQuickMissions([
      {
        _id: '1',
        name: 'First Steps',
        description: 'Take your first 1000 steps',
        rewards: { xp: 50, coins: 10 },
        progress: 80
      },
      {
        _id: '2',
        name: 'Green Commuter',
        description: 'Use eco-friendly transport',
        rewards: { xp: 100, coins: 25 },
        progress: 30
      }
    ])
    setRecentAchievements([
      { id: 'first_login', name: 'Welcome Warrior', icon: '🎉' },
      { id: 'profile_complete', name: 'Profile Master', icon: '✅' }
    ])
  }, [])

  const handleTrackingToggle = async () => {
    if (isTracking) {
      await stopFitnessSession()
    } else {
      await startFitnessSession()
    }
  }

  const progressToNextLevel = {
    current: gameState?.stats?.xp || 0,
    needed: Math.pow((gameState?.stats?.level || 1) + 1, 2) * 100,
    percentage: ((gameState?.stats?.xp || 0) % (Math.pow(gameState?.stats?.level || 1, 2) * 100)) / (Math.pow(gameState?.stats?.level || 1, 2) * 100) * 100
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16">
              <Avatar3D 
                model={gameState?.avatar?.model || 'default'}
                color={gameState?.avatar?.color || '#3B82F6'}
                size="small"
                animate={true}
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white gaming-font">
                Welcome back, {user?.username}!
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2 text-gaming-400">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-semibold">Level {gameState?.stats?.level || 1}</span>
                </div>
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-semibold">{gameState?.stats?.coins || 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-orange-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-semibold">{gameState?.stats?.streakDays || 0} day streak</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTrackingToggle}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isTracking 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gradient-to-r from-fitness-500 to-fitness-600 hover:from-fitness-600 hover:to-fitness-700 text-white'
              }`}
            >
              {isTracking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isTracking ? 'Stop Tracking' : 'Start Adventure'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-gaming-500 to-gaming-600 hover:from-gaming-600 hover:to-gaming-700 text-white rounded-xl font-semibold transition-all"
            >
              <Gift className="w-5 h-5" />
              <span className="hidden md:inline">Daily Spin</span>
            </motion.button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <span>Level {gameState?.stats?.level || 1}</span>
            <span>{gameState?.stats?.xp || 0} / {progressToNextLevel.needed} XP</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-gaming-500 to-gaming-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Today's Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatsCard
          title="Steps"
          value={todayStats.steps.toLocaleString()}
          icon={<TrendingUp className="w-6 h-6" />}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
          change="+12%"
        />
        <StatsCard
          title="Distance"
          value={`${todayStats.distance} km`}
          icon={<MapPin className="w-6 h-6" />}
          color="text-green-400"
          bgColor="bg-green-500/20"
          change="+8%"
        />
        <StatsCard
          title="Active Time"
          value={`${todayStats.activeTime} min`}
          icon={<Calendar className="w-6 h-6" />}
          color="text-purple-400"
          bgColor="bg-purple-500/20"
          change="+15%"
        />
        <StatsCard
          title="Calories"
          value={todayStats.calories}
          icon={<Zap className="w-6 h-6" />}
          color="text-orange-400"
          bgColor="bg-orange-500/20"
          change="+5%"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Missions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Target className="w-6 h-6 text-gaming-400" />
                <span>Quick Missions</span>
              </h2>
              <button className="text-gaming-400 hover:text-gaming-300 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {quickMissions.map((mission) => (
                <MissionCard key={mission._id} mission={mission} />
              ))}
            </div>

            {quickMissions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active missions. Start tracking to unlock new challenges!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Side Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Recent Achievements */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Recent Badges</span>
            </h3>
            
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>

            {recentAchievements.length === 0 && (
              <div className="text-center py-4 text-gray-400">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Complete missions to earn badges!</p>
              </div>
            )}
          </div>

          {/* Social Quick Stats */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Social</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Friends</span>
                <span className="text-white font-semibold">{gameState.friends?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Rank</span>
                <span className="text-gaming-400 font-semibold">#42</span>
              </div>
              <button className="w-full mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium">
                View Leaderboard
              </button>
            </div>
          </div>

          {/* Eco Impact */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-green-400" />
              <span>Eco Impact</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Trees Planted</span>
                <span className="text-green-400 font-semibold">{gameState?.sustainabilityStats?.treesPlanted || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Green Miles</span>
                <span className="text-green-400 font-semibold">{Math.round((gameState?.sustainabilityStats?.greenMiles || 0) / 1000)}km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">CO₂ Saved</span>
                <span className="text-green-400 font-semibold">{gameState?.sustainabilityStats?.carbonSaved || 0}kg</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
