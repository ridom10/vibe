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
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'revealing' | 'winner'>('idle')
  const spinStartTime = useRef(0)
  const initialAngle = (index / total) * Math.PI * 2
  const radius = Math.min(3 + total * 0.3, 5)

  // Calculate initial position in a circle
  const basePosition = {
    x: Math.cos(initialAngle) * radius,
    y: Math.sin(initialAngle) * 0.5,
    z: Math.sin(initialAngle) * radius
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
      groupRef.current.position.y = basePosition.y + Math.sin(time * 1.5 + index) * 0.2
      groupRef.current.position.z = basePosition.z
      groupRef.current.rotation.y = Math.sin(time * 0.5 + index) * 0.1
      groupRef.current.scale.setScalar(1)
    } else if (animationPhase === 'spinning') {
      // Fast spinning around center
      const elapsed = (Date.now() - spinStartTime.current) / 1000
      const spinSpeed = 3 + elapsed * 0.5 // Accelerates over time
      const currentAngle = initialAngle + elapsed * spinSpeed

      groupRef.current.position.x = Math.cos(currentAngle) * (radius - elapsed * 0.3)
      groupRef.current.position.y = Math.sin(time * 8) * 0.5
      groupRef.current.position.z = Math.sin(currentAngle) * (radius - elapsed * 0.3)
      groupRef.current.rotation.y += 0.15
      groupRef.current.rotation.x = Math.sin(time * 5) * 0.2

      // Pulse scale during spin
      const pulse = 1 + Math.sin(time * 10) * 0.1
      groupRef.current.scale.setScalar(pulse)
    } else if (animationPhase === 'winner') {
      // Winner moves to center and grows
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 3, 0.1)
      groupRef.current.rotation.y = Math.sin(time * 2) * 0.1

      // Grow effect
      const targetScale = 1.5
      const currentScale = groupRef.current.scale.x
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.08))
    } else if (animationPhase === 'revealing') {
      // Non-winners fade back
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, basePosition.x * 1.5, 0.05)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, basePosition.y, 0.05)
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, basePosition.z * 1.5 - 5, 0.05)

      // Shrink and fade
      const targetScale = 0.3
      const currentScale = groupRef.current.scale.x
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.05))
    }
  })

  // Don't render if faded out
  const opacity = animationPhase === 'revealing' ? 0.3 : 1
  const emissiveIntensity = isWinner && animationPhase === 'winner' ? 0.5 : 0.1

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      <RoundedBox args={[2.5, 1.5, 0.1]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.15}
          roughness={0.1}
          metalness={0.1}
          transmission={0.9}
          thickness={0.5}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={isWinner ? '#fbbf24' : '#a855f7'}
          emissiveIntensity={emissiveIntensity}
        />
      </RoundedBox>

      {/* Glass border effect */}
      <RoundedBox args={[2.55, 1.55, 0.08]} radius={0.12} smoothness={4}>
        <meshBasicMaterial
          color={isWinner ? '#fbbf24' : '#a855f7'}
          transparent
          opacity={opacity * 0.3}
          wireframe
        />
      </RoundedBox>

      <Text
        position={[0, 0, 0.1]}
        fontSize={0.25}
        maxWidth={2}
        textAlign="center"
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  )
}
