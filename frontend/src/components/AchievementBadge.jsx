import React from 'react'
import { motion } from 'framer-motion'

const AchievementBadge = ({ achievement, size = 'small', showDate = true }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'large':
        return {
          container: 'p-4',
          icon: 'text-3xl',
          title: 'text-lg font-bold',
          desc: 'text-sm'
        }
      case 'medium':
        return {
          container: 'p-3',
          icon: 'text-2xl',
          title: 'text-base font-semibold',
          desc: 'text-sm'
        }
      default:
        return {
          container: 'p-2',
          icon: 'text-lg',
          title: 'text-sm font-medium',
          desc: 'text-xs'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`glass-effect rounded-xl ${sizeClasses.container} border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10`}
    >
      <div className="flex items-center space-x-3">
        <div className={`${sizeClasses.icon} animate-bounce-slow`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <h4 className={`text-yellow-400 ${sizeClasses.title}`}>
            {achievement.name}
          </h4>
          {achievement.description && (
            <p className={`text-gray-300 ${sizeClasses.desc}`}>
              {achievement.description}
            </p>
          )}
          {showDate && achievement.unlockedAt && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default AchievementBadge
