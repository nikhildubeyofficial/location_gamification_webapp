import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Navigation, 
  MapPin, 
  Target, 
  Play, 
  Pause, 
  Settings,
  Layers,
  Zap,
  Users,
  Leaf
} from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { useGame } from '../contexts/GameContext'
import { useAuth } from '../contexts/AuthContext'
import MapplsAPI from '../lib/mapplsApi'
import Avatar3D from '../components/Avatar3D'

const MapView = () => {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const mapplsApiRef = useRef(null)
  const [userLocation, setUserLocation] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [route, setRoute] = useState(null)
  const [geofences, setGeofences] = useState([])
  const [collectibles, setCollectibles] = useState([])
  const [showLayers, setShowLayers] = useState({
    avatar: true,
    collectibles: true,
    geofences: true,
    friends: true
  })
  
  const { user } = useAuth()
  const { gameState, startFitnessSession, stopFitnessSession } = useGame()

  // Initialize Mappls Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    const initMap = async () => {
      try {
        // Initialize Mappls API (you'll need to add your API key to .env)
        mapplsApiRef.current = new MapplsAPI(import.meta.env.VITE_MAPPLS_API_KEY || 'demo-key')
        
        // Get user's current location
        const location = await mapplsApiRef.current.getCurrentLocation()
        setUserLocation(location)

        // Initialize map
        const map = mapplsApiRef.current.initializeMap('map-container', {
          center: [location.lat, location.lng],
          zoom: 15
        })
        
        mapRef.current = map

        // Add user location marker
        mapplsApiRef.current.addMarker(
          { lat: location.lat, lng: location.lng },
          {
            title: 'Your Location',
            icon: '📍'
          }
        )

        // Initialize demo geofences and collectibles
        initializeDemoData(location)

      } catch (error) {
        console.error('Failed to initialize map:', error)
        // Fallback to demo location (Delhi)
        const demoLocation = { lat: 28.6139, lng: 77.2090 }
        setUserLocation(demoLocation)
        initializeDemoData(demoLocation)
      }
    }

    initMap()
  }, [])

  const initializeDemoData = (centerLocation) => {
    // Demo geofences (checkpoints)
    const demoGeofences = [
      {
        id: 'checkpoint-1',
        name: 'Fitness Park',
        center: { lat: centerLocation.lat + 0.002, lng: centerLocation.lng + 0.002 },
        radius: 100,
        type: 'fitness',
        reward: { xp: 50, coins: 10 }
      },
      {
        id: 'checkpoint-2',
        name: 'Eco Station',
        center: { lat: centerLocation.lat - 0.003, lng: centerLocation.lng + 0.001 },
        radius: 150,
        type: 'sustainability',
        reward: { xp: 75, coins: 20 }
      },
      {
        id: 'battle-zone-1',
        name: 'AR Battle Arena',
        center: { lat: centerLocation.lat + 0.001, lng: centerLocation.lng - 0.002 },
        radius: 200,
        type: 'battle',
        reward: { xp: 100, coins: 50 }
      }
    ]

    // Demo collectibles
    const demoCollectibles = [
      {
        id: 'coin-1',
        position: { lat: centerLocation.lat + 0.001, lng: centerLocation.lng + 0.001 },
        type: 'coin',
        value: 25
      },
      {
        id: 'gem-1',
        position: { lat: centerLocation.lat - 0.001, lng: centerLocation.lng - 0.001 },
        type: 'gem',
        value: 100
      },
      {
        id: 'heart-1',
        position: { lat: centerLocation.lat + 0.0015, lng: centerLocation.lng - 0.0015 },
        type: 'heart',
        value: 50
      }
    ]

    setGeofences(demoGeofences)
    setCollectibles(demoCollectibles)

    // Add geofences to map
    if (mapplsApiRef.current) {
      demoGeofences.forEach(geofence => {
        mapplsApiRef.current.addCircle(
          geofence.center,
          geofence.radius,
          {
            fillColor: geofence.type === 'fitness' ? '#10B981' : 
                      geofence.type === 'sustainability' ? '#059669' : '#8B5CF6',
            fillOpacity: 0.2,
            strokeColor: geofence.type === 'fitness' ? '#10B981' : 
                        geofence.type === 'sustainability' ? '#059669' : '#8B5CF6',
            strokeWeight: 2
          }
        )

        mapplsApiRef.current.addMarker(
          geofence.center,
          {
            title: geofence.name,
            icon: geofence.type === 'fitness' ? '🏃' : 
                  geofence.type === 'sustainability' ? '🌱' : '⚔️'
          }
        )
      })

      // Add collectible markers
      demoCollectibles.forEach(collectible => {
        mapplsApiRef.current.addMarker(
          collectible.position,
          {
            title: `${collectible.type} (+${collectible.value})`,
            icon: collectible.type === 'coin' ? '🪙' : 
                  collectible.type === 'gem' ? '💎' : '❤️'
          }
        )
      })
    }
  }

  const handleTrackingToggle = async () => {
    if (isTracking) {
      await stopFitnessSession()
      setIsTracking(false)
    } else {
      await startFitnessSession()
      setIsTracking(true)
      startLocationTracking()
    }
  }

  const startLocationTracking = () => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        setUserLocation(newLocation)
        
        // Update map center
        if (mapRef.current) {
          mapplsApiRef.current.setCenter(newLocation)
        }

        // Check geofence entries
        checkGeofenceEntries(newLocation)
        
        // Check collectible pickups
        checkCollectiblePickups(newLocation)
      },
      (error) => console.error('Location tracking error:', error),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }

  const checkGeofenceEntries = (location) => {
    geofences.forEach(geofence => {
      if (mapplsApiRef.current?.isInsideGeofence(location, geofence)) {
        // Trigger geofence entry
        console.log(`Entered ${geofence.name}!`)
        // Award rewards, trigger missions, etc.
      }
    })
  }

  const checkCollectiblePickups = (location) => {
    collectibles.forEach(collectible => {
      const distance = mapplsApiRef.current?.calculateDistance(location, collectible.position)
      if (distance < 50) { // 50 meter pickup radius
        // Collect item
        console.log(`Collected ${collectible.type}!`)
        setCollectibles(prev => prev.filter(c => c.id !== collectible.id))
      }
    })
  }

  const toggleLayer = (layer) => {
    setShowLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }))
  }

  return (
    <div className="relative h-screen w-full">
      {/* Map Container */}
      <div 
        id="map-container" 
        ref={mapContainerRef}
        className="absolute inset-0 mappls-map"
        style={{ zIndex: 1 }}
      />

      {/* Three.js Overlay for 3D Avatar and Collectibles */}
      {showLayers.avatar && userLocation && (
        <div 
          className="absolute inset-0 pointer-events-none threejs-overlay"
          style={{ zIndex: 10 }}
        >
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            
            {/* 3D Avatar at user location */}
            <group position={[0, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color={gameState?.avatar?.color || '#3B82F6'} />
              </mesh>
            </group>

            {/* 3D Collectibles */}
            {showLayers.collectibles && collectibles.map((collectible, index) => (
              <group key={collectible.id} position={[index * 0.5 - 1, Math.sin(Date.now() * 0.001 + index) * 0.2, 0]}>
                <mesh rotation={[0, Date.now() * 0.001, 0]}>
                  {collectible.type === 'coin' ? (
                    <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
                  ) : collectible.type === 'gem' ? (
                    <boxGeometry args={[0.08, 0.08, 0.08]} />
                  ) : (
                    <sphereGeometry args={[0.06, 16, 16]} />
                  )}
                  <meshStandardMaterial 
                    color={collectible.type === 'coin' ? '#FFD700' : 
                          collectible.type === 'gem' ? '#9333EA' : '#EF4444'} 
                    metalness={0.8}
                    roughness={0.2}
                  />
                </mesh>
              </group>
            ))}
          </Canvas>
        </div>
      )}

      {/* UI Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        {/* Left Panel - Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-effect rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center space-x-2 text-gaming-400">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">{gameState.stats.xp} XP</span>
          </div>
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-semibold">{gameState.stats.coins}</span>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <Leaf className="w-4 h-4" />
            <span className="text-sm font-semibold">{gameState.sustainabilityStats.treesPlanted}</span>
          </div>
        </motion.div>

        {/* Right Panel - Controls */}
        <div className="flex space-x-2">
          {/* Layer Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLayers(prev => ({ ...prev, showPanel: !prev.showPanel }))}
            className="glass-effect p-3 rounded-xl text-white hover:text-gaming-400 transition-colors"
          >
            <Layers className="w-5 h-5" />
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-effect p-3 rounded-xl text-white hover:text-gaming-400 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Bottom Panel - Tracking Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12">
                <Avatar3D 
                  color={gameState?.avatar?.color || '#3B82F6'}
                  size="small"
                  animate={isTracking}
                />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {isTracking ? 'Adventure in Progress' : 'Ready for Adventure'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {isTracking ? 'Tracking your journey...' : 'Start exploring to earn rewards'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Current Location */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (userLocation && mapRef.current) {
                    mapplsApiRef.current.setCenter(userLocation)
                    mapplsApiRef.current.setZoom(16)
                  }
                }}
                className="glass-effect p-3 rounded-xl text-white hover:text-blue-400 transition-colors"
              >
                <Navigation className="w-5 h-5" />
              </motion.button>

              {/* Start/Stop Tracking */}
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
                <span>{isTracking ? 'Stop' : 'Start'}</span>
              </motion.button>
            </div>
          </div>

          {/* Live Stats */}
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-700"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">1,247</p>
                  <p className="text-sm text-gray-400">Steps</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">0.8</p>
                  <p className="text-sm text-gray-400">km</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">23</p>
                  <p className="text-sm text-gray-400">minutes</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Nearby Points of Interest */}
      <div className="absolute top-20 right-4 z-20 w-80 max-h-96 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-effect rounded-xl p-4 space-y-3"
        >
          <h3 className="text-white font-semibold flex items-center space-x-2">
            <Target className="w-5 h-5 text-gaming-400" />
            <span>Nearby Objectives</span>
          </h3>
          
          {geofences.map((geofence) => (
            <div key={geofence.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {geofence.type === 'fitness' ? '🏃' : 
                   geofence.type === 'sustainability' ? '🌱' : '⚔️'}
                </span>
                <div>
                  <p className="text-white text-sm font-medium">{geofence.name}</p>
                  <p className="text-gray-400 text-xs">
                    +{geofence.reward.xp} XP, +{geofence.reward.coins} coins
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gaming-400 text-sm font-semibold">150m</p>
                <p className="text-gray-500 text-xs">away</p>
              </div>
            </div>
          ))}

          {collectibles.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-300 text-sm mb-2">Collectibles Nearby:</p>
              <div className="flex space-x-2">
                {collectibles.slice(0, 5).map((collectible) => (
                  <div key={collectible.id} className="text-center">
                    <div className="text-lg animate-bounce">
                      {collectible.type === 'coin' ? '🪙' : 
                       collectible.type === 'gem' ? '💎' : '❤️'}
                    </div>
                    <p className="text-xs text-gray-400">+{collectible.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default MapView
