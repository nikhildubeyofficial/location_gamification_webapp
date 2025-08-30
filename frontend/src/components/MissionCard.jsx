import React from 'react'
import { motion } from 'framer-motion'
import { Target, Zap, Coins, Clock, CheckCircle } from 'lucide-react'

const MissionCard = ({ mission, onJoin, onComplete, showProgress = true }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/20'
      case 'legendary': return 'text-purple-400 bg-purple-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'fitness': return '🏃'
      case 'social': return '👥'
      case 'sustainability': return '🌱'
      case 'exploration': return '🗺️'
      case 'challenge': return '⚡'
      default: return '🎯'
    }
  }

  const isCompleted = mission.progress >= 100 || mission.status === 'completed'

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-effect rounded-xl p-4 border border-gray-700 hover:border-gaming-500/50 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getTypeIcon(mission.type)}</div>
          <div>
            <h3 className="font-semibold text-white">{mission.name}</h3>
            <p className="text-sm text-gray-400">{mission.description}</p>
          </div>
        </div>
        
        {mission.difficulty && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(mission.difficulty)}`}>
            {mission.difficulty}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && mission.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
            <span>Progress</span>
            <span>{Math.round(mission.progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${
                isCompleted 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-gaming-500 to-gaming-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(mission.progress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Rewards */}
      {mission.rewards && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            {mission.rewards.xp && (
              <div className="flex items-center space-x-1 text-gaming-400">
                <Zap className="w-4 h-4" />
                <span>{mission.rewards.xp} XP</span>
              </div>
            )}
            {mission.rewards.coins && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <Coins className="w-4 h-4" />
                <span>{mission.rewards.coins}</span>
              </div>
            )}
            {mission.rewards.badge && (
              <div className="flex items-center space-x-1 text-purple-400">
                <span>🏅</span>
                <span className="text-xs">{mission.rewards.badge.name || 'Badge'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {mission.timeLimit && (
              <div className="flex items-center space-x-1 text-orange-400 text-xs">
                <Clock className="w-3 h-3" />
                <span>24h</span>
              </div>
            )}
            
            {isCompleted ? (
              <div className="flex items-center space-x-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            ) : (
              <div className="flex space-x-2">
                {onJoin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onJoin(mission)}
                    className="px-3 py-1 bg-gaming-500 hover:bg-gaming-600 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    Join
                  </motion.button>
                )}
                {onComplete && mission.progress >= 100 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onComplete(mission)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    Claim
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default MissionCard
