import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus, Users, Target, Zap, Leaf } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import Avatar3D from '../components/Avatar3D'

const Leaderboard = () => {
  const { user } = useAuth()
  const { gameState, fetchLeaderboard } = useGame()
  const [activeCategory, setActiveCategory] = useState('xp')
  const [activeTimeframe, setActiveTimeframe] = useState('weekly')
  const [leaderboardData, setLeaderboardData] = useState([])
  const [userPosition, setUserPosition] = useState(null)

  const categories = [
    { id: 'xp', label: 'XP', icon: <Zap className="w-4 h-4" />, color: 'text-gaming-400' },
    { id: 'steps', label: 'Steps', icon: <Target className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'distance', label: 'Distance', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400' },
    { id: 'eco_score', label: 'Eco Score', icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-400' }
  ]

  const timeframes = [
    { id: 'daily', label: 'Today' },
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'all_time', label: 'All Time' }
  ]

  useEffect(() => {
    fetchLeaderboard(activeTimeframe)
    // Demo leaderboard data
    setLeaderboardData([
      {
        rank: 1,
        user: {
          _id: '1',
          username: 'FitnessKing',
          avatar: { color: '#FFD700', accessories: ['crown'] },
          gameStats: { level: 15, xp: 12500 }
        },
        score: 12500,
        change: 'up',
        previousRank: 2
      },
      {
        rank: 2,
        user: {
          _id: '2',
          username: 'EcoWarrior',
          avatar: { color: '#10B981', accessories: ['cape'] },
          gameStats: { level: 12, xp: 9800 }
        },
        score: 9800,
        change: 'down',
        previousRank: 1
      },
      {
        rank: 3,
        user: {
          _id: '3',
          username: 'StepMaster',
          avatar: { color: '#3B82F6', accessories: ['hat'] },
          gameStats: { level: 11, xp: 8900 }
        },
        score: 8900,
        change: 'up',
        previousRank: 4
      },
      {
        rank: 4,
        user: {
          _id: user?._id || '4',
          username: user?.username || 'You',
          avatar: gameState?.avatar || { color: '#3B82F6', accessories: [] },
          gameStats: gameState?.stats || { level: 1, xp: 0 }
        },
        score: gameState?.stats?.xp || 0,
        change: 'same',
        previousRank: 4
      }
    ])
    setUserPosition(4)
  }, [activeCategory, activeTimeframe])

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>
    }
  }

  const getChangeIcon = (change) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const formatScore = (score, category) => {
    switch (category) {
      case 'steps':
        return score.toLocaleString()
      case 'distance':
        return `${(score / 1000).toFixed(1)}km`
      case 'eco_score':
        return score.toLocaleString()
      default:
        return score.toLocaleString()
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white gaming-font flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span>Leaderboard</span>
            </h1>
            <p className="text-gray-300 mt-2">Compete with friends and climb the ranks</p>
          </div>
          
          {userPosition && (
            <div className="glass-effect rounded-xl p-4 bg-gaming-500/20 border border-gaming-500/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-gaming-400">#{userPosition}</div>
                <div className="text-sm text-gray-300">Your Rank</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-xl p-2"
      >
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium ${
                activeCategory === category.id
                  ? 'bg-gaming-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className={activeCategory === category.id ? 'text-white' : category.color}>
                {category.icon}
              </span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Timeframe Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-xl p-2"
      >
        <div className="flex space-x-1">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.id}
              onClick={() => setActiveTimeframe(timeframe.id)}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                activeTimeframe === timeframe.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex justify-center items-end space-x-4 mb-6">
          {/* 2nd Place */}
          {leaderboardData[1] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="glass-effect rounded-xl p-4 bg-gray-500/20 border border-gray-400/30 h-32 flex flex-col justify-between">
                <div className="w-12 h-12 mx-auto">
                  <Avatar3D 
                    color={leaderboardData[1].user.avatar.color}
                    accessories={leaderboardData[1].user.avatar.accessories}
                    size="small"
                  />
                </div>
                <div>
                  <div className="flex justify-center mb-1">
                    <Medal className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    {leaderboardData[1].user.username}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatScore(leaderboardData[1].score, activeCategory)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {leaderboardData[0] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="glass-effect rounded-xl p-4 bg-yellow-500/20 border border-yellow-400/30 h-40 flex flex-col justify-between">
                <div className="w-16 h-16 mx-auto">
                  <Avatar3D 
                    color={leaderboardData[0].user.avatar.color}
                    accessories={leaderboardData[0].user.avatar.accessories}
                    size="small"
                    animate={true}
                  />
                </div>
                <div>
                  <div className="flex justify-center mb-1">
                    <Crown className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-base font-bold text-white truncate">
                    {leaderboardData[0].user.username}
                  </div>
                  <div className="text-sm text-yellow-400 font-semibold">
                    {formatScore(leaderboardData[0].score, activeCategory)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {leaderboardData[2] && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="glass-effect rounded-xl p-4 bg-amber-600/20 border border-amber-600/30 h-28 flex flex-col justify-between">
                <div className="w-12 h-12 mx-auto">
                  <Avatar3D 
                    color={leaderboardData[2].user.avatar.color}
                    accessories={leaderboardData[2].user.avatar.accessories}
                    size="small"
                  />
                </div>
                <div>
                  <div className="flex justify-center mb-1">
                    <Medal className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    {leaderboardData[2].user.username}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatScore(leaderboardData[2].score, activeCategory)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Full Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Full Rankings</span>
        </h3>

        <div className="space-y-3">
          {leaderboardData.map((entry, index) => (
            <motion.div
              key={entry.user._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                entry.user._id === user?._id
                  ? 'bg-gaming-500/20 border border-gaming-500/30'
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getRankIcon(entry.rank)}
                  {getChangeIcon(entry.change)}
                </div>
                
                <div className="w-12 h-12">
                  <Avatar3D 
                    color={entry.user.avatar.color}
                    accessories={entry.user.avatar.accessories}
                    size="small"
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${
                      entry.user._id === user?._id ? 'text-gaming-300' : 'text-white'
                    }`}>
                      {entry.user.username}
                      {entry.user._id === user?._id && ' (You)'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Level {entry.user.gameStats.level}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {entry.previousRank && entry.previousRank !== entry.rank && (
                      <span>
                        Previous: #{entry.previousRank}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {formatScore(entry.score, activeCategory)}
                </div>
                <div className="text-sm text-gray-400">
                  {activeCategory === 'xp' && 'XP'}
                  {activeCategory === 'steps' && 'steps'}
                  {activeCategory === 'distance' && 'distance'}
                  {activeCategory === 'eco_score' && 'eco points'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Friends Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span>Friends Only</span>
        </h3>

        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Add friends to see how you compare!</p>
          <button className="mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium">
            Invite Friends
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Leaderboard
