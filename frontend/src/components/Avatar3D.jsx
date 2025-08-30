import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

// Simple 3D Avatar Component
const AvatarMesh = ({ color, animate, accessories = [] }) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (animate && meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group 
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {/* Head */}
      <Sphere args={[0.3, 32, 32]} position={[0, 0.7, 0]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {/* Body */}
      <Cylinder args={[0.2, 0.25, 0.6, 8]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      
      {/* Arms */}
      <Cylinder args={[0.08, 0.08, 0.4, 8]} position={[-0.35, 0.1, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.4, 8]} position={[0.35, 0.1, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      
      {/* Legs */}
      <Cylinder args={[0.08, 0.08, 0.5, 8]} position={[-0.12, -0.55, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.5, 8]} position={[0.12, -0.55, 0]}>
        <meshStandardMaterial color={color} />
      </Cylinder>

      {/* Eyes */}
      <Sphere args={[0.05, 16, 16]} position={[-0.1, 0.75, 0.25]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.05, 16, 16]} position={[0.1, 0.75, 0.25]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>

      {/* Accessories */}
      {accessories.includes('hat') && (
        <Cylinder args={[0.35, 0.3, 0.1, 8]} position={[0, 0.95, 0]}>
          <meshStandardMaterial color="#8B4513" />
        </Cylinder>
      )}
      
      {accessories.includes('backpack') && (
        <Box args={[0.2, 0.3, 0.15]} position={[0, 0.1, -0.3]}>
          <meshStandardMaterial color="#4A5568" />
        </Box>
      )}
    </group>
  )
}

// Floating collectible items
const FloatingCollectible = ({ position, type = 'coin' }) => {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  const getCollectibleMesh = () => {
    switch (type) {
      case 'coin':
        return (
          <Cylinder args={[0.1, 0.1, 0.02, 16]} ref={meshRef}>
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
          </Cylinder>
        )
      case 'gem':
        return (
          <Box args={[0.1, 0.1, 0.1]} ref={meshRef}>
            <meshStandardMaterial color="#9333EA" metalness={0.9} roughness={0.1} />
          </Box>
        )
      case 'heart':
        return (
          <Sphere args={[0.08, 16, 16]} ref={meshRef}>
            <meshStandardMaterial color="#EF4444" />
          </Sphere>
        )
      default:
        return (
          <Sphere args={[0.05, 16, 16]} ref={meshRef}>
            <meshStandardMaterial color="#10B981" />
          </Sphere>
        )
    }
  }

  return (
    <group position={position}>
      {getCollectibleMesh()}
    </group>
  )
}

// Main Avatar3D Component
const Avatar3D = ({ 
  model = 'default', 
  color = '#3B82F6', 
  size = 'medium',
  animate = false,
  accessories = [],
  showCollectibles = false,
  collectibles = [],
  interactive = true
}) => {
  const canvasRef = useRef()
  
  const getCanvasSize = () => {
    switch (size) {
      case 'small': return { width: 80, height: 80 }
      case 'large': return { width: 300, height: 300 }
      default: return { width: 150, height: 150 }
    }
  }

  const canvasSize = getCanvasSize()

  return (
    <div 
      className="avatar-3d-container"
      style={{ 
        width: canvasSize.width, 
        height: canvasSize.height,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, 5]} intensity={0.4} />

        {/* Avatar */}
        <AvatarMesh 
          color={color} 
          animate={animate}
          accessories={accessories}
        />

        {/* Floating Collectibles */}
        {showCollectibles && collectibles.map((collectible, index) => (
          <FloatingCollectible
            key={index}
            position={collectible.position}
            type={collectible.type}
          />
        ))}

        {/* Controls */}
        {interactive && size !== 'small' && (
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
          />
        )}
      </Canvas>
    </div>
  )
}

// Avatar Customization Panel
export const AvatarCustomizer = ({ currentAvatar, onUpdate }) => {
  const [selectedColor, setSelectedColor] = useState(currentAvatar.color)
  const [selectedAccessories, setSelectedAccessories] = useState(currentAvatar.accessories || [])

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  const availableAccessories = [
    { id: 'hat', name: 'Hat', icon: '🎩' },
    { id: 'backpack', name: 'Backpack', icon: '🎒' },
    { id: 'sunglasses', name: 'Sunglasses', icon: '🕶️' },
    { id: 'cape', name: 'Cape', icon: '🦸' }
  ]

  const handleColorChange = (color) => {
    setSelectedColor(color)
    onUpdate({ ...currentAvatar, color })
  }

  const toggleAccessory = (accessoryId) => {
    const newAccessories = selectedAccessories.includes(accessoryId)
      ? selectedAccessories.filter(id => id !== accessoryId)
      : [...selectedAccessories, accessoryId]
    
    setSelectedAccessories(newAccessories)
    onUpdate({ ...currentAvatar, accessories: newAccessories })
  }

  return (
    <div className="glass-effect rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Customize Avatar</h3>
      
      {/* Preview */}
      <div className="flex justify-center mb-6">
        <Avatar3D 
          color={selectedColor}
          accessories={selectedAccessories}
          animate={true}
          size="large"
        />
      </div>

      {/* Color Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Avatar Color</h4>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                selectedColor === color 
                  ? 'border-white scale-110' 
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Accessories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Accessories</h4>
        <div className="grid grid-cols-2 gap-2">
          {availableAccessories.map((accessory) => (
            <button
              key={accessory.id}
              onClick={() => toggleAccessory(accessory.id)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                selectedAccessories.includes(accessory.id)
                  ? 'border-gaming-500 bg-gaming-500/20 text-gaming-300'
                  : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-lg mb-1">{accessory.icon}</div>
              <div className="text-xs font-medium">{accessory.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Avatar3D
