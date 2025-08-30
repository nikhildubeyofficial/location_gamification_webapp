import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Leaf, TreePine, Recycle, Car, Award, TrendingUp, MapPin, Users, Calendar } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import StatsCard from '../components/StatsCard'
import MissionCard from '../components/MissionCard'

const Sustainability = () => {
  const { gameState, completeSustainabilityMission } = useGame()
  const [activeTab, setActiveTab] = useState('overview')
  const [ecoStats, setEcoStats] = useState({
    treesPlanted: 12,
    carbonSaved: 45.6,
    greenMiles: 128.3,
    ecoScore: 2450,
    weeklyGrowth: 15.2,
    rank: 23
  })
  const [sustainabilityMissions, setSustainabilityMissions] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    // Demo sustainability missions
    setSustainabilityMissions([
      {
        _id: 'eco1',
        name: 'Green Commuter Challenge',
        description: 'Use eco-friendly transport for 10km this week',
        type: 'sustainability',
        category: 'transport',
        difficulty: 'medium',
        progress: 65,
        target: 10,
        current: 6.5,
        unit: 'km',
        rewards: { xp: 200, coins: 50, trees: 2 },
        timeLimit: { expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
        participants: 156
      },
      {
        _id: 'eco2',
        name: 'Tree Planting Marathon',
        description: 'Plant 5 virtual trees by completing eco-routes',
        type: 'sustainability',
        category: 'trees',
        difficulty: 'easy',
        progress: 80,
        target: 5,
        current: 4,
        unit: 'trees',
        rewards: { xp: 150, coins: 30, badge: { name: 'Tree Planter' } },
        participants: 89
      },
      {
        _id: 'eco3',
        name: 'Zero Waste Week',
        description: 'Log eco-friendly activities for 7 consecutive days',
        type: 'sustainability',
        category: 'lifestyle',
        difficulty: 'hard',
        progress: 42,
        target: 7,
        current: 3,
        unit: 'days',
        rewards: { xp: 300, coins: 75, trees: 3, badge: { name: 'Eco Warrior' } },
        participants: 234
      }
    ])

    // Demo recent activities
    setRecentActivities([
      {
        id: 1,
        type: 'tree_planted',
        description: 'Planted a virtual tree by walking the Green Route',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        impact: { trees: 1, carbon: 2.3 }
      },
      {
        id: 2,
        type: 'green_transport',
        description: 'Cycled 5.2km instead of driving',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        impact: { carbon: 3.1, distance: 5.2 }
      },
      {
        id: 3,
        type: 'cleanup_mission',
        description: 'Completed Park Cleanup Mission',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        impact: { ecoScore: 150, trees: 2 }
      }
    ])
  }, [])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Leaf className="w-4 h-4" /> },
    { id: 'missions', label: 'Eco Missions', icon: <Award className="w-4 h-4" /> },
    { id: 'impact', label: 'My Impact', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'community', label: 'Community', icon: <Users className="w-4 h-4" /> }
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'tree_planted':
        return <TreePine className="w-5 h-5 text-green-400" />
      case 'green_transport':
        return <Car className="w-5 h-5 text-blue-400" />
      case 'cleanup_mission':
        return <Recycle className="w-5 h-5 text-purple-400" />
      default:
        return <Leaf className="w-5 h-5 text-emerald-400" />
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
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
              <Leaf className="w-8 h-8 text-emerald-400" />
              <span>Sustainability</span>
            </h1>
            <p className="text-gray-300 mt-2">Make a positive impact on the environment</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="glass-effect rounded-xl p-3 bg-emerald-500/20 border border-emerald-500/30">
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-400">{ecoStats.ecoScore}</div>
                <div className="text-xs text-gray-300">Eco Score</div>
              </div>
            </div>
            <div className="glass-effect rounded-xl p-3 bg-green-500/20 border border-green-500/30">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">#{ecoStats.rank}</div>
                <div className="text-xs text-gray-300">Eco Rank</div>
              </div>
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
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<TreePine className="w-6 h-6" />}
              label="Trees Planted"
              value={ecoStats.treesPlanted}
              change={`+${Math.floor(ecoStats.weeklyGrowth)}%`}
              color="text-green-400"
            />
            <StatsCard
              icon={<Leaf className="w-6 h-6" />}
              label="Carbon Saved"
              value={`${ecoStats.carbonSaved}kg`}
              change={`+${ecoStats.weeklyGrowth.toFixed(1)}%`}
              color="text-emerald-400"
            />
            <StatsCard
              icon={<Car className="w-6 h-6" />}
              label="Green Miles"
              value={`${ecoStats.greenMiles}km`}
              change={`+${(ecoStats.weeklyGrowth * 0.8).toFixed(1)}%`}
              color="text-blue-400"
            />
            <StatsCard
              icon={<Award className="w-6 h-6" />}
              label="Eco Score"
              value={ecoStats.ecoScore}
              change={`+${Math.floor(ecoStats.weeklyGrowth * 1.2)}%`}
              color="text-purple-400"
            />
          </div>

          {/* Recent Activities */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Recent Eco Activities</span>
            </h3>
            
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center space-x-4">
                    {getActivityIcon(activity.type)}
                    <div>
                      <div className="text-white font-medium">{activity.description}</div>
                      <div className="text-sm text-gray-400">{formatTimeAgo(activity.timestamp)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {activity.impact.trees && (
                      <div className="text-green-400 text-sm">+{activity.impact.trees} trees</div>
                    )}
                    {activity.impact.carbon && (
                      <div className="text-emerald-400 text-sm">-{activity.impact.carbon}kg CO₂</div>
                    )}
                    {activity.impact.ecoScore && (
                      <div className="text-purple-400 text-sm">+{activity.impact.ecoScore} eco score</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {sustainabilityMissions.map((mission, index) => (
            <motion.div
              key={mission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MissionCard
                mission={mission}
                onComplete={mission.progress >= 100 ? completeSustainabilityMission : undefined}
                showProgress={true}
                sustainabilityMode={true}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Impact Tab */}
      {activeTab === 'impact' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Impact Visualization */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Your Environmental Impact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trees Impact */}
              <div className="glass-effect rounded-xl p-6 bg-green-500/10 border border-green-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <TreePine className="w-8 h-8 text-green-400" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Trees Planted</h4>
                    <p className="text-sm text-gray-400">Virtual forest contribution</p>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-green-400 mb-2">{ecoStats.treesPlanted}</div>
                <div className="text-sm text-gray-300 mb-4">
                  Equivalent to {(ecoStats.treesPlanted * 2.3).toFixed(1)}kg CO₂ absorbed annually
                </div>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(ecoStats.treesPlanted, 10) }).map((_, i) => (
                    <TreePine key={i} className="w-4 h-4 text-green-400" />
                  ))}
                  {ecoStats.treesPlanted > 10 && (
                    <span className="text-green-400 text-sm">+{ecoStats.treesPlanted - 10}</span>
                  )}
                </div>
              </div>

              {/* Carbon Impact */}
              <div className="glass-effect rounded-xl p-6 bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <Leaf className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Carbon Saved</h4>
                    <p className="text-sm text-gray-400">CO₂ emissions reduced</p>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-emerald-400 mb-2">{ecoStats.carbonSaved}kg</div>
                <div className="text-sm text-gray-300 mb-4">
                  Equivalent to {Math.floor(ecoStats.carbonSaved / 2.3)} car-free kilometers
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((ecoStats.carbonSaved / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">This Month's Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-400 mb-1">{ecoStats.greenMiles.toFixed(1)}km</div>
                <div className="text-sm text-gray-400">Green Transport</div>
                <div className="text-xs text-green-400 mt-1">+{ecoStats.weeklyGrowth.toFixed(1)}% vs last month</div>
              </div>
              
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <div className="text-2xl font-bold text-green-400 mb-1">{ecoStats.treesPlanted}</div>
                <div className="text-sm text-gray-400">Trees Planted</div>
                <div className="text-xs text-green-400 mt-1">+{Math.floor(ecoStats.weeklyGrowth)} vs last month</div>
              </div>
              
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <div className="text-2xl font-bold text-purple-400 mb-1">{ecoStats.ecoScore}</div>
                <div className="text-sm text-gray-400">Eco Score</div>
                <div className="text-xs text-green-400 mt-1">+{Math.floor(ecoStats.weeklyGrowth * 1.2)}% vs last month</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Community Stats */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Community Impact</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">1,247</div>
                <div className="text-gray-300">Trees Planted</div>
                <div className="text-sm text-gray-400">by all users this month</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">3.2T</div>
                <div className="text-gray-300">CO₂ Saved</div>
                <div className="text-sm text-gray-400">community total</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">5,689km</div>
                <div className="text-gray-300">Green Miles</div>
                <div className="text-sm text-gray-400">eco-friendly transport</div>
              </div>
            </div>
          </div>

          {/* Top Eco Warriors */}
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Top Eco Warriors</h3>
            
            <div className="space-y-3">
              {[
                { name: 'EcoChampion', score: 4250, trees: 28, rank: 1 },
                { name: 'GreenGuru', score: 3890, trees: 24, rank: 2 },
                { name: 'NatureNinja', score: 3650, trees: 22, rank: 3 },
                { name: 'You', score: ecoStats.ecoScore, trees: ecoStats.treesPlanted, rank: ecoStats.rank }
              ].map((user, index) => (
                <div
                  key={user.name}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    user.name === 'You' 
                      ? 'bg-emerald-500/20 border border-emerald-500/30' 
                      : 'bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-bold text-gray-400">#{user.rank}</div>
                    <div>
                      <div className={`font-semibold ${
                        user.name === 'You' ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-400">{user.trees} trees planted</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{user.score}</div>
                    <div className="text-sm text-gray-400">eco score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Sustainability
