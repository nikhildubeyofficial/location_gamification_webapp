import React from 'react'
import { motion } from 'framer-motion'

const StatsCard = ({ title, label, value, icon, color, bgColor, change }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-effect rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <div className={color}>
            {icon}
          </div>
        </div>
        {change && (
          <span className={`text-xs font-medium ${
            change.startsWith('+') ? 'text-green-400' : 'text-red-400'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{title || label}</p>
      </div>
    </motion.div>
  )
}

export default StatsCard
