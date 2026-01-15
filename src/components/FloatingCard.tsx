import { useRef, useEffect } from 'react'
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
  const startTimeRef = useRef(Date.now())
  const completedRef = useRef(false)

  const initialAngle = (index / total) * Math.PI * 2
  const radius = Math.min(2.5 + total * 0.25, 4)

  const basePosition = {
    x: Math.cos(initialAngle) * radius,
    y: Math.sin(initialAngle) * 0.3,
    z: Math.sin(initialAngle) * radius * 0.5
  }

  useEffect(() => {
    startTimeRef.current = Date.now()
    completedRef.current = false
  }, [animationPhase])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime
    const elapsed = (Date.now() - startTimeRef.current) / 1000

    if (animationPhase === 'idle') {
      // Gentle floating animation
      groupRef.current.position.x = basePosition.x
      groupRef.current.position.y = basePosition.y + Math.sin(time * 0.8 + index * 0.5) * 0.15
      groupRef.current.position.z = basePosition.z
      groupRef.current.rotation.y = Math.sin(time * 0.3 + index) * 0.05
      groupRef.current.rotation.x = Math.sin(time * 0.4 + index * 0.7) * 0.02
      groupRef.current.scale.setScalar(1)
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

      // Spring scale with overshoot to 1.2x
      const targetScale = 1.2
      const overshoot = appearProgress < 0.7 ? targetScale * 1.15 : targetScale
      const scale = THREE.MathUtils.lerp(0.5, overshoot, springEased)
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

      // Trigger callback after animation
      if (appearProgress >= 1 && !completedRef.current) {
        completedRef.current = true
        setTimeout(() => onAnimationComplete?.(), 200)
      }
    } else if (animationPhase === 'loser') {
      // Losers appear smaller around the winner
      const appearProgress = Math.min(elapsed / 0.6, 1)
      const eased = 1 - Math.pow(1 - appearProgress, 2)

      const loserAngle = initialAngle
      const loserRadius = 2.5
      const targetX = Math.cos(loserAngle) * loserRadius
      const targetY = Math.sin(loserAngle) * 0.3 - 0.5
      const targetZ = -1 + Math.sin(loserAngle) * 0.5

      groupRef.current.position.x = THREE.MathUtils.lerp(0, targetX, eased)
      groupRef.current.position.y = THREE.MathUtils.lerp(0, targetY, eased)
      groupRef.current.position.z = THREE.MathUtils.lerp(2, targetZ, eased)

      const scale = THREE.MathUtils.lerp(0, 0.5, eased)
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
  const glowColor = isWinnerPhase ? '#fbbf24' : '#a855f7'

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

      {/* Main glass card */}
      <RoundedBox args={[2.4, 1.4, 0.08]} radius={0.15} smoothness={4}>
        <meshPhysicalMaterial
          ref={materialRef}
          color="#ffffff"
          transparent
          opacity={opacity * 0.12}
          roughness={0.05}
          metalness={0.1}
          transmission={0.95}
          thickness={0.3}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive={glowColor}
          emissiveIntensity={isWinnerPhase ? 0.5 : 0.15}
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
