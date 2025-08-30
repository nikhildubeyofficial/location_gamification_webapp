import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile: {
      fitnessLevel: 'beginner',
      goals: []
    }
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const fitnessLevels = [
    { value: 'beginner', label: 'Beginner', desc: 'Just starting out' },
    { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
    { value: 'advanced', label: 'Advanced', desc: 'Very active' }
  ]

  const fitnessGoals = [
    { value: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
    { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
    { value: 'endurance', label: 'Endurance', icon: '🏃' },
    { value: 'general_fitness', label: 'General Fitness', icon: '🎯' },
    { value: 'sustainability', label: 'Eco Fitness', icon: '🌱' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1]
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          [profileField]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleGoalToggle = (goal) => {
    const currentGoals = formData.profile.goals
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal]
    
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        goals: updatedGoals
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      return
    }

    setLoading(true)

    const { confirmPassword, ...signupData } = formData
    const result = await signup(signupData)
    
    if (result.success) {
      navigate('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-gaming-500 to-fitness-500 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="gaming-font text-4xl font-bold text-white mb-2">
            Join FitQuest
          </h2>
          <p className="text-gray-300">
            Start your gamified fitness adventure
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-effect rounded-2xl p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-12 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-500 focus:border-gaming-500 sm:text-sm backdrop-blur-sm"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-12 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-500 focus:border-gaming-500 sm:text-sm backdrop-blur-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-12 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gaming-500 focus:border-gaming-500 sm:text-sm backdrop-blur-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className={`appearance-none relative block w-full px-12 py-3 border placeholder-gray-400 text-white bg-gray-800/50 rounded-lg focus:outline-none focus:ring-2 focus:border-gaming-500 sm:text-sm backdrop-blur-sm ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-600 focus:ring-gaming-500'
                  }`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">Passwords don't match</p>
              )}
            </div>
          </div>

          {/* Fitness Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Fitness Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {fitnessLevels.map((level) => (
                <label key={level.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="profile.fitnessLevel"
                    value={level.value}
                    checked={formData.profile.fitnessLevel === level.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.profile.fitnessLevel === level.value
                      ? 'border-gaming-500 bg-gaming-500/20 text-gaming-300'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}>
                    <div className="font-medium text-sm">{level.label}</div>
                    <div className="text-xs opacity-75">{level.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fitness Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Fitness Goals (select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fitnessGoals.map((goal) => (
                <label key={goal.value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.profile.goals.includes(goal.value)}
                    onChange={() => handleGoalToggle(goal.value)}
                    className="sr-only"
                  />
                  <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.profile.goals.includes(goal.value)
                      ? 'border-fitness-500 bg-fitness-500/20 text-fitness-300'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}>
                    <div className="text-lg mb-1">{goal.icon}</div>
                    <div className="font-medium text-xs">{goal.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading || formData.password !== formData.confirmPassword}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-gaming-600 to-gaming-700 hover:from-gaming-700 hover:to-gaming-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gaming-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Start Your Adventure'
              )}
            </motion.button>
          </div>

          <div className="text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-gaming-400 hover:text-gaming-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  )
}

export default Signup
