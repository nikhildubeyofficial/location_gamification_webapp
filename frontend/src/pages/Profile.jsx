import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Trophy, Star, MapPin, Calendar, Camera, Edit3, Save, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import Avatar3D from '../components/Avatar3D'
import AchievementBadge from '../components/AchievementBadge'
import StatsCard from '../components/StatsCard'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const { gameState, updateAvatar } = useGame()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    profile: {
      age: '',
      height: '',
      weight: '',
      fitnessLevel: '',
      goals: []
    }
  })

  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || '',
        email: user.email || '',
        profile: {
          age: user.profile?.age || '',
          height: user.profile?.height || '',
          weight: user.profile?.weight || '',
          fitnessLevel: user.profile?.fitnessLevel || 'beginner',
          goals: user.profile?.goals || []
        }
      })
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistics', icon: <Star className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ]

  const fitnessLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ]

  const fitnessGoals = [
    'Weight Loss',
    'Muscle Gain',
    'Endurance',
    'Flexibility',
    'General Fitness',
    'Mental Health'
  ]

  const achievements = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Completed your first fitness session',
      icon: '👟',
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rarity: 'common'
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Added 5 friends to your network',
      icon: '🦋',
      unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rarity: 'uncommon'
    },
    {
      id: 'eco_warrior',
      name: 'Eco Warrior',
      description: 'Planted 10 virtual trees',
      icon: '🌱',
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      rarity: 'rare'
    },
    {
      id: 'distance_master',
      name: 'Distance Master',
      description: 'Walked 100km total distance',
      icon: '🏃',
      unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      rarity: 'epic'
    }
  ]

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleGoalToggle = (goal) => {
    setEditForm(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        goals: prev.profile.goals.includes(goal)
          ? prev.profile.goals.filter(g => g !== goal)
          : [...prev.profile.goals, goal]
      }
    }))
  }

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32">
              <Avatar3D 
                color={gameState?.avatar?.color || '#3B82F6'}
                accessories={gameState?.avatar?.accessories || []}
                animate={true}
              />
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-gaming-500 hover:bg-gaming-600 rounded-full transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white gaming-font">
                {user?.username || 'Player'}
              </h1>
              <div className="flex items-center space-x-1 px-3 py-1 bg-gaming-500/20 rounded-full">
                <Star className="w-4 h-4 text-gaming-400" />
                <span className="text-gaming-400 font-semibold">Level {gameState.stats.level}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatJoinDate(user?.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{user?.location?.city || 'Location not set'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gaming-400">{gameState.stats.xp}</div>
                <div className="text-xs text-gray-400">XP</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">{gameState.stats.coins}</div>
                <div className="text-xs text-gray-400">Coins</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">{achievements.length}</div>
                <div className="text-xs text-gray-400">Badges</div>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditing 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-gaming-500/20 text-gaming-400 hover:bg-gaming-500/30'
            }`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span className="ml-2">{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
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
                  ? 'bg-gaming-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Profile Information</h3>
            {isEditing && (
              <button
                onClick={handleSaveProfile}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-white">{user?.username}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-white">{user?.email}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fitness Level</label>
                {isEditing ? (
                  <select
                    value={editForm.profile.fitnessLevel}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      profile: { ...prev.profile, fitnessLevel: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
                  >
                    {fitnessLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-white capitalize">
                    {user?.profile?.fitnessLevel || 'Not set'}
                  </div>
                )}
              </div>
            </div>

            {/* Physical Stats */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.profile.age}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      profile: { ...prev.profile, age: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-white">
                    {user?.profile?.age || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Height (cm)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.profile.height}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      profile: { ...prev.profile, height: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-white">
                    {user?.profile?.height ? `${user.profile.height} cm` : 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.profile.weight}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      profile: { ...prev.profile, weight: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-white">
                    {user?.profile?.weight ? `${user.profile.weight} kg` : 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fitness Goals */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Fitness Goals</label>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fitnessGoals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => handleGoalToggle(goal)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editForm.profile.goals.includes(goal)
                        ? 'bg-gaming-500 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.profile?.goals?.length > 0 ? (
                  user.profile.goals.map(goal => (
                    <span key={goal} className="px-3 py-1 bg-gaming-500/20 text-gaming-400 rounded-full text-sm">
                      {goal}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No goals set</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Achievement Collection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AchievementBadge achievement={achievement} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<Star className="w-6 h-6" />}
              label="Total XP"
              value={gameState.stats.xp}
              color="text-gaming-400"
            />
            <StatsCard
              icon={<Trophy className="w-6 h-6" />}
              label="Level"
              value={gameState.stats.level}
              color="text-yellow-400"
            />
            <StatsCard
              icon={<User className="w-6 h-6" />}
              label="Achievements"
              value={achievements.length}
              color="text-purple-400"
            />
            <StatsCard
              icon={<MapPin className="w-6 h-6" />}
              label="Distance"
              value={`${gameState.stats.totalDistance || 0}km`}
              color="text-green-400"
            />
          </div>
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <div>
                <div className="font-medium text-white">Notifications</div>
                <div className="text-sm text-gray-400">Receive push notifications for missions and achievements</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <div>
                <div className="font-medium text-white">Location Sharing</div>
                <div className="text-sm text-gray-400">Share your location with friends</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <div>
                <div className="font-medium text-white">Public Profile</div>
                <div className="text-sm text-gray-400">Make your profile visible to other users</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Profile
