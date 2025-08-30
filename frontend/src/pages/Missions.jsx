import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Filter, Plus, Search, Trophy, Clock, Users } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import MissionCard from '../components/MissionCard'

const Missions = () => {
  const { gameState, completeMission, fetchGameData } = useGame()
  const [activeTab, setActiveTab] = useState('active')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [missions, setMissions] = useState({
    active: [],
    available: [],
    completed: []
  })

  useEffect(() => {
    fetchGameData()
    // Demo missions data
    setMissions({
      active: [
        {
          _id: '1',
          name: 'First Steps',
          description: 'Take your first 1000 steps to begin your fitness journey',
          type: 'fitness',
          difficulty: 'easy',
          progress: 80,
          rewards: { xp: 50, coins: 10, badge: { name: 'First Steps' } },
          timeLimit: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        },
        {
          _id: '2',
          name: 'Green Commuter',
          description: 'Use eco-friendly transport for 5km',
          type: 'sustainability',
          difficulty: 'medium',
          progress: 30,
          rewards: { xp: 150, coins: 30, badge: { name: 'Green Commuter' } }
        },
        {
          _id: '3',
          name: 'Social Explorer',
          description: 'Invite 3 friends to join your fitness journey',
          type: 'social',
          difficulty: 'medium',
          progress: 66,
          rewards: { xp: 200, coins: 50 }
        }
      ],
      available: [
        {
          _id: '4',
          name: 'Distance Walker',
          description: 'Walk 2 kilometers in a single session',
          type: 'fitness',
          difficulty: 'medium',
          rewards: { xp: 100, coins: 25 }
        },
        {
          _id: '5',
          name: 'Tree Planter',
          description: 'Plant 5 virtual trees by walking eco-friendly routes',
          type: 'sustainability',
          difficulty: 'hard',
          rewards: { xp: 300, coins: 75, badge: { name: 'Tree Planter' } }
        },
        {
          _id: '6',
          name: 'AR Treasure Hunter',
          description: 'Find and collect 10 AR treasures in battle zones',
          type: 'exploration',
          difficulty: 'legendary',
          rewards: { xp: 500, coins: 150, badge: { name: 'Treasure Master' } }
        }
      ],
      completed: [
        {
          _id: '7',
          name: 'Welcome Warrior',
          description: 'Complete your profile setup',
          type: 'challenge',
          difficulty: 'easy',
          progress: 100,
          rewards: { xp: 25, coins: 5 },
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ]
    })
  }, [])

  const tabs = [
    { id: 'active', label: 'Active', icon: <Target className="w-4 h-4" />, count: missions.active.length },
    { id: 'available', label: 'Available', icon: <Plus className="w-4 h-4" />, count: missions.available.length },
    { id: 'completed', label: 'Completed', icon: <Trophy className="w-4 h-4" />, count: missions.completed.length }
  ]

  const missionTypes = [
    { value: 'all', label: 'All Types', icon: '🎯' },
    { value: 'fitness', label: 'Fitness', icon: '🏃' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'sustainability', label: 'Eco', icon: '🌱' },
    { value: 'exploration', label: 'Explore', icon: '🗺️' },
    { value: 'challenge', label: 'Challenge', icon: '⚡' }
  ]

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'legendary', label: 'Legendary' }
  ]

  const filteredMissions = missions[activeTab].filter(mission => {
    const matchesType = filterType === 'all' || mission.type === filterType
    const matchesDifficulty = filterDifficulty === 'all' || mission.difficulty === filterDifficulty
    const matchesSearch = mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesDifficulty && matchesSearch
  })

  const handleJoinMission = async (mission) => {
    // In a real app, this would call the API
    console.log('Joining mission:', mission.name)
    // Move from available to active
    setMissions(prev => ({
      ...prev,
      available: prev.available.filter(m => m._id !== mission._id),
      active: [...prev.active, { ...mission, progress: 0 }]
    }))
  }

  const handleCompleteMission = async (mission) => {
    await completeMission(mission._id)
    // Move from active to completed
    setMissions(prev => ({
      ...prev,
      active: prev.active.filter(m => m._id !== mission._id),
      completed: [...prev.completed, { ...mission, completedAt: new Date() }]
    }))
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
            <h1 className="text-3xl font-bold text-white gaming-font">Missions</h1>
            <p className="text-gray-300 mt-2">Complete challenges to earn XP, coins, and badges</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gaming-400">
              <Target className="w-5 h-5" />
              <span className="font-semibold">{missions.active.length} Active</span>
            </div>
            <div className="flex items-center space-x-2 text-yellow-400">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">{missions.completed.length} Completed</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-xl p-2"
      >
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium ${
                activeTab === tab.id
                  ? 'bg-gaming-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-xl p-4"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search missions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gaming-500 focus:border-gaming-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
            >
              {missionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Mission List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredMissions.length > 0 ? (
          filteredMissions.map((mission, index) => (
            <motion.div
              key={mission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MissionCard
                mission={mission}
                onJoin={activeTab === 'available' ? handleJoinMission : undefined}
                onComplete={activeTab === 'active' && mission.progress >= 100 ? handleCompleteMission : undefined}
                showProgress={activeTab !== 'available'}
              />
            </motion.div>
          ))
        ) : (
          <div className="glass-effect rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">
              {activeTab === 'active' ? '🎯' : activeTab === 'available' ? '🔍' : '🏆'}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'active' && 'No Active Missions'}
              {activeTab === 'available' && 'No Available Missions'}
              {activeTab === 'completed' && 'No Completed Missions'}
            </h3>
            <p className="text-gray-400">
              {activeTab === 'active' && 'Join some missions from the Available tab to get started!'}
              {activeTab === 'available' && 'Check back later for new missions or adjust your filters.'}
              {activeTab === 'completed' && 'Complete some missions to see your achievements here.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      {activeTab === 'active' && missions.active.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Mission Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gaming-400">
                {Math.round(missions.active.reduce((sum, m) => sum + m.progress, 0) / missions.active.length)}%
              </div>
              <div className="text-sm text-gray-400">Average Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {missions.active.reduce((sum, m) => sum + (m.rewards.xp || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Potential XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {missions.active.filter(m => m.progress >= 100).length}
              </div>
              <div className="text-sm text-gray-400">Ready to Complete</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Missions
