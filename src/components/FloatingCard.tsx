import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

type AnimationPhase = 'idle' | 'merging' | 'winner' | 'loser'

interface FloatingCardProps {
  text: string
  index: number
  total: number
  isSpinning: boolean
  isWinner: boolean
  animationPhase?: AnimationPhase
  onAnimationComplete?: () => void
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// Animation constants for mobile vs desktop
const ANIMATION_CONFIG = {
  mobile: {
    floatAmplitude: 0.08,      // Reduced from 0.15 - less chaotic
    rotationAmplitude: 0.02,   // Very subtle rotation
    floatSpeed: 0.6,           // Slower, smoother
    scale: 0.85                // Slightly larger than before for visibility
  },
  desktop: {
    floatAmplitude: 0.15,
    rotationAmplitude: 0.05,
    floatSpeed: 0.8,
    scale: 1
  }
}

export default function FloatingCard({
  text,
  index,
  total,
  animationPhase = 'idle',
  onAnimationComplete
}: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const outerGlowRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const startTimeRef = useRef(0)
  const completedRef = useRef(false)
  const callbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()

  // Get animation config based on device
  const config = isMobile ? ANIMATION_CONFIG.mobile : ANIMATION_CONFIG.desktop

  const initialAngle = (index / total) * Math.PI * 2
  // Tighter radius on mobile for better visibility
  const radius = Math.min(2.5 + total * 0.25, 4) * (isMobile ? 0.7 : 1)

  const basePosition = {
    x: Math.cos(initialAngle) * radius,
    y: Math.sin(initialAngle) * 0.3,
    z: Math.sin(initialAngle) * radius * 0.5
  }

  useEffect(() => {
    startTimeRef.current = Date.now()
    completedRef.current = false
    // Cancel any pending callback from previous phase
    if (callbackTimeoutRef.current) {
      clearTimeout(callbackTimeoutRef.current)
      callbackTimeoutRef.current = null
    }
  }, [animationPhase])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime
    const elapsed = (Date.now() - startTimeRef.current) / 1000

    if (animationPhase === 'idle') {
      // Gentle floating animation - smoother on mobile
      groupRef.current.position.x = basePosition.x
      groupRef.current.position.y = basePosition.y + Math.sin(time * config.floatSpeed + index * 0.5) * config.floatAmplitude
      groupRef.current.position.z = basePosition.z
      groupRef.current.rotation.y = Math.sin(time * 0.3 + index) * config.rotationAmplitude
      groupRef.current.rotation.x = Math.sin(time * 0.4 + index * 0.7) * (config.rotationAmplitude * 0.4)
      groupRef.current.scale.setScalar(config.scale)
    } else if (animationPhase === 'merging') {
      // Merge to center
      const mergeProgress = Math.min(elapsed / 0.4, 1)
      const eased = 1 - Math.pow(1 - mergeProgress, 3)

      groupRef.current.position.x = THREE.MathUtils.lerp(basePosition.x, 0, eased)
      groupRef.current.position.y = THREE.MathUtils.lerp(basePosition.y, 0, eased)
      groupRef.current.position.z = THREE.MathUtils.lerp(basePosition.z, 2, eased)

      const scale = THREE.MathUtils.lerp(1, 0, eased)
      groupRef.current.scale.setScalar(Math.max(scale, 0.01))
      groupRef.current.rotation.y += 0.1
    } else if (animationPhase === 'winner') {
      // Winner appears from center with spring animation
      const appearProgress = Math.min(elapsed / 0.8, 1)
      const springEased = 1 - Math.pow(1 - appearProgress, 3)

      groupRef.current.position.x = 0
      groupRef.current.position.z = 2

      // Spring scale with overshoot to 1.2x (scaled for device)
      const targetScale = 1.2 * config.scale
      const overshoot = appearProgress < 0.7 ? targetScale * 1.15 : targetScale
      const scale = THREE.MathUtils.lerp(0.5 * config.scale, overshoot, springEased)
      groupRef.current.scale.setScalar(scale)

      // Gentle float after appearing
      if (appearProgress > 0.5) {
        groupRef.current.position.y = Math.sin(time * 2) * 0.08
        groupRef.current.rotation.y = Math.sin(time * 1.5) * 0.03
      } else {
        groupRef.current.position.y = 0
      }

      // Pulsing golden glow effect on material
      if (materialRef.current) {
        const pulseIntensity = 0.4 + Math.sin(time * 3) * 0.3
        materialRef.current.emissiveIntensity = pulseIntensity
      }

      // Trigger callback after animation (with guard to prevent double-firing)
      if (appearProgress >= 1 && !completedRef.current && onAnimationComplete) {
        completedRef.current = true
        // Clear any existing timeout to prevent double-firing on re-renders
        if (callbackTimeoutRef.current) {
          clearTimeout(callbackTimeoutRef.current)
        }
        callbackTimeoutRef.current = setTimeout(() => {
          // Extra guard: only call if ref is still marked as completed (not reset)
          if (completedRef.current) {
            onAnimationComplete()
          }
        }, 200)
      }
    } else if (animationPhase === 'loser') {
      // Losers appear smaller around the winner
      const appearProgress = Math.min(elapsed / 0.6, 1)
      const eased = 1 - Math.pow(1 - appearProgress, 2)

      const loserAngle = initialAngle
      const loserRadius = 2.5 * (isMobile ? 0.65 : 1)
      const targetX = Math.cos(loserAngle) * loserRadius
      const targetY = Math.sin(loserAngle) * 0.3 - 0.5
      const targetZ = -1 + Math.sin(loserAngle) * 0.5

      groupRef.current.position.x = THREE.MathUtils.lerp(0, targetX, eased)
      groupRef.current.position.y = THREE.MathUtils.lerp(0, targetY, eased)
      groupRef.current.position.z = THREE.MathUtils.lerp(2, targetZ, eased)

      const scale = THREE.MathUtils.lerp(0, 0.5 * config.scale, eased)
      groupRef.current.scale.setScalar(scale)

      if (appearProgress > 0.5) {
        groupRef.current.position.y += Math.sin(time * 0.8 + index) * 0.05
      }
    }

    // Animate glowing edge
    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial
      const isWinnerAnim = animationPhase === 'winner'
      const glowIntensity = isWinnerAnim
        ? 0.7 + Math.sin(time * 4) * 0.25
        : 0.4 + Math.sin(time * 2 + index) * 0.1

      glowMaterial.opacity = animationPhase === 'loser' ? glowIntensity * 0.4 : glowIntensity
    }

    // Animate outer glow for winner
    if (outerGlowRef.current && animationPhase === 'winner') {
      const outerGlowMaterial = outerGlowRef.current.material as THREE.MeshBasicMaterial
      const pulseOpacity = 0.15 + Math.sin(time * 3) * 0.1
      outerGlowMaterial.opacity = pulseOpacity
    }
  })

  const isWinnerPhase = animationPhase === 'winner'
  const isLoserPhase = animationPhase === 'loser'
  const opacity = isLoserPhase ? 0.5 : 1
  const glowColor = isWinnerPhase ? '#fbbf24' : '#22d3ee'

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      {/* Outer glow halo for winner */}
      {isWinnerPhase && (
        <mesh ref={outerGlowRef} position={[0, 0, -0.05]}>
          <RoundedBox args={[3.2, 2.0, 0.01]} radius={0.25} smoothness={4}>
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.2}
            />
          </RoundedBox>
        </mesh>
      )}

      {/* Main glass card - premium glass material */}
      <RoundedBox args={[2.4, 1.4, 0.08]} radius={0.15} smoothness={4}>
        <meshPhysicalMaterial
          ref={materialRef}
          color="#ffffff"
          transparent
          opacity={opacity * 0.15}
          roughness={0.02}
          metalness={0.05}
          transmission={0.92}
          thickness={0.4}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0.02}
          ior={1.5}
          emissive={glowColor}
          emissiveIntensity={isWinnerPhase ? 0.5 : 0.2}
        />
      </RoundedBox>

      {/* Glowing edge effect */}
      <mesh ref={glowRef}>
        <RoundedBox args={[2.5, 1.5, 0.02]} radius={0.18} smoothness={4}>
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.5}
          />
        </RoundedBox>
      </mesh>

      {/* Inner subtle glow */}
      <RoundedBox args={[2.3, 1.3, 0.01]} radius={0.12} smoothness={4}>
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={opacity * 0.08}
        />
      </RoundedBox>

      <Text
        position={[0, 0, 0.1]}
        fontSize={isWinnerPhase ? 0.32 : 0.28}
        maxWidth={2}
        textAlign="center"
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight={isWinnerPhase ? 700 : 600}
      >
        {text}
      </Text>
    </group>
  )
}
