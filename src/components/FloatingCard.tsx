import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface FloatingCardProps {
  text: string
  index: number
  total: number
  isSpinning: boolean
  isWinner: boolean
  onAnimationComplete?: () => void
}

export default function FloatingCard({
  text,
  index,
  total,
  isSpinning,
  isWinner,
  onAnimationComplete
}: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'revealing' | 'winner'>('idle')
  const spinStartTime = useRef(0)
  const initialAngle = (index / total) * Math.PI * 2
  const radius = Math.min(2.5 + total * 0.25, 4)

  // Calculate initial position in a circle
  const basePosition = {
    x: Math.cos(initialAngle) * radius,
    y: Math.sin(initialAngle) * 0.3,
    z: Math.sin(initialAngle) * radius * 0.5
  }

  useEffect(() => {
    if (isSpinning) {
      setAnimationPhase('spinning')
      spinStartTime.current = Date.now()
    } else if (isWinner && animationPhase === 'spinning') {
      setAnimationPhase('winner')
      setTimeout(() => {
        onAnimationComplete?.()
      }, 1000)
    } else if (!isSpinning && !isWinner && animationPhase === 'spinning') {
      setAnimationPhase('revealing')
    } else if (!isSpinning && animationPhase !== 'winner') {
      setAnimationPhase('idle')
    }
  }, [isSpinning, isWinner, animationPhase, onAnimationComplete])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime

    if (animationPhase === 'idle') {
      // Gentle floating animation
      groupRef.current.position.x = basePosition.x
      groupRef.current.position.y = basePosition.y + Math.sin(time * 0.8 + index * 0.5) * 0.15
      groupRef.current.position.z = basePosition.z
      groupRef.current.rotation.y = Math.sin(time * 0.3 + index) * 0.05
      groupRef.current.rotation.x = Math.sin(time * 0.4 + index * 0.7) * 0.02
      groupRef.current.scale.setScalar(1)
    } else if (animationPhase === 'spinning') {
      // Fast spinning around center
      const elapsed = (Date.now() - spinStartTime.current) / 1000
      const spinSpeed = 3 + elapsed * 0.5
      const currentAngle = initialAngle + elapsed * spinSpeed

      groupRef.current.position.x = Math.cos(currentAngle) * (radius - elapsed * 0.3)
      groupRef.current.position.y = Math.sin(time * 8) * 0.5
      groupRef.current.position.z = Math.sin(currentAngle) * (radius - elapsed * 0.3) * 0.5
      groupRef.current.rotation.y += 0.15
      groupRef.current.rotation.x = Math.sin(time * 5) * 0.2

      const pulse = 1 + Math.sin(time * 10) * 0.1
      groupRef.current.scale.setScalar(pulse)
    } else if (animationPhase === 'winner') {
      // Winner moves to center and grows
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 2, 0.1)
      groupRef.current.rotation.y = Math.sin(time * 2) * 0.05
      groupRef.current.rotation.x = 0

      const targetScale = 1.5
      const currentScale = groupRef.current.scale.x
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.08))
    } else if (animationPhase === 'revealing') {
      // Non-winners fade back
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, basePosition.x * 1.5, 0.05)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, basePosition.y, 0.05)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, basePosition.z - 3, 0.05)

      const targetScale = 0.3
      const currentScale = groupRef.current.scale.x
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.05))
    }

    // Animate glowing edge
    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial
      const glowIntensity = isWinner && animationPhase === 'winner'
        ? 0.6 + Math.sin(time * 4) * 0.3
        : 0.4 + Math.sin(time * 2 + index) * 0.1
      glowMaterial.opacity = glowIntensity
    }
  })

  const opacity = animationPhase === 'revealing' ? 0.3 : 1
  const emissiveIntensity = isWinner && animationPhase === 'winner' ? 0.6 : 0.15
  const glowColor = isWinner && animationPhase === 'winner' ? '#fbbf24' : '#a855f7'

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      {/* Main glass card */}
      <RoundedBox args={[2.4, 1.4, 0.08]} radius={0.15} smoothness={4}>
        <meshPhysicalMaterial
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
          emissiveIntensity={emissiveIntensity}
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
        fontSize={0.28}
        maxWidth={2}
        textAlign="center"
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight={600}
      >
        {text}
      </Text>
    </group>
  )
}
