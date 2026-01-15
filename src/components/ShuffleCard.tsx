import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface ShuffleCardProps {
  options: string[]
  onComplete: () => void
}

export default function ShuffleCard({ options, onComplete }: ShuffleCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayText, setDisplayText] = useState(options[0])
  const startTimeRef = useRef(0)
  const lastFlipTimeRef = useRef(0)
  const flipCountRef = useRef(0)
  const completedRef = useRef(false)
  const initializedRef = useRef(false)

  const SHUFFLE_DURATION = 3500 // 3.5 seconds total

  useEffect(() => {
    const now = Date.now()
    startTimeRef.current = now
    lastFlipTimeRef.current = now
    flipCountRef.current = 0
    completedRef.current = false
    initializedRef.current = true
  }, [])

  useFrame((state) => {
    if (!groupRef.current || completedRef.current) return

    const time = state.clock.elapsedTime
    const elapsed = Date.now() - startTimeRef.current
    const progress = Math.min(elapsed / SHUFFLE_DURATION, 1)

    // Exponential slowdown: start fast, end slow
    // interval starts at ~50ms and increases to ~500ms
    const baseInterval = 50
    const maxInterval = 500
    const currentInterval = baseInterval + (maxInterval - baseInterval) * Math.pow(progress, 2)

    const timeSinceLastFlip = Date.now() - lastFlipTimeRef.current

    if (timeSinceLastFlip >= currentInterval && progress < 1) {
      // Flip to next option
      lastFlipTimeRef.current = Date.now()
      flipCountRef.current++
      const nextIndex = (currentIndex + 1) % options.length
      setCurrentIndex(nextIndex)
      setDisplayText(options[nextIndex])

      // Trigger flip animation
      if (groupRef.current) {
        groupRef.current.rotation.y = Math.PI * 2 * (flipCountRef.current % 2 === 0 ? 1 : -1) * 0.05
      }
    }

    // Card animation
    if (groupRef.current) {
      // Gentle float
      groupRef.current.position.y = Math.sin(time * 3) * 0.1

      // Scale pulse that intensifies as we slow down
      const pulseIntensity = 0.05 + progress * 0.1
      const scale = 1.1 + Math.sin(time * (10 - progress * 5)) * pulseIntensity
      groupRef.current.scale.setScalar(scale)

      // Rotation wobble that decreases over time
      const wobbleAmount = (1 - progress) * 0.1
      groupRef.current.rotation.x = Math.sin(time * 8) * wobbleAmount
      groupRef.current.rotation.y = Math.sin(time * 6) * wobbleAmount
    }

    // Animate glow
    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial
      const glowIntensity = 0.4 + Math.sin(time * 8) * 0.2 + progress * 0.2
      glowMaterial.opacity = glowIntensity
    }

    // Mark as complete
    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 2]}>
      {/* Main glass card */}
      <RoundedBox args={[2.8, 1.6, 0.1]} radius={0.18} smoothness={4}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.05}
          metalness={0.1}
          transmission={0.95}
          thickness={0.3}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive="#22d3ee"
          emissiveIntensity={0.3}
        />
      </RoundedBox>

      {/* Glowing edge effect */}
      <mesh ref={glowRef}>
        <RoundedBox args={[2.9, 1.7, 0.02]} radius={0.2} smoothness={4}>
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.6}
          />
        </RoundedBox>
      </mesh>

      {/* Energetic inner glow during shuffle */}
      <RoundedBox args={[2.6, 1.4, 0.01]} radius={0.15} smoothness={4}>
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.15}
        />
      </RoundedBox>

      <Text
        position={[0, 0, 0.12]}
        fontSize={0.32}
        maxWidth={2.2}
        textAlign="center"
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        {displayText}
      </Text>
    </group>
  )
}
