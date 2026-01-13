import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { AnimationPhase } from '../hooks/useAnimationTimeline'

interface FloatingCardProps {
  text: string
  index: number
  total: number
  animationPhase: AnimationPhase
  isWinner: boolean
}

export default function FloatingCard({
  text,
  index,
  total,
  animationPhase,
  isWinner
}: FloatingCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const spinStartTime = useRef(0)

  const initialAngle = (index / total) * Math.PI * 2
  const radius = Math.min(3 + total * 0.3, 5)

  // Memoize base position for performance
  const basePosition = useMemo(() => ({
    x: Math.cos(initialAngle) * radius,
    y: Math.sin(initialAngle) * 0.5,
    z: Math.sin(initialAngle) * radius
  }), [initialAngle, radius])

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
      // Record start time on first frame
      if (spinStartTime.current === 0) {
        spinStartTime.current = Date.now()
      }

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
    } else if (animationPhase === 'revealing') {
      // Reset spin start time
      spinStartTime.current = 0

      if (isWinner) {
        // Winner moves to center and grows with golden glow
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1)
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1)
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 3, 0.1)
        groupRef.current.rotation.y = Math.sin(time * 2) * 0.1

        // Grow effect
        const targetScale = 1.5
        const currentScale = groupRef.current.scale.x
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.08))
      } else {
        // Non-winners will be handled by ShatterEffect - just hide them
        groupRef.current.scale.setScalar(0)
      }
    } else if (animationPhase === 'result') {
      // Keep winner in position
      if (isWinner) {
        groupRef.current.rotation.y = Math.sin(time * 2) * 0.1
      }
    }
  })

  // Determine visual state
  const opacity = 1
  const emissiveIntensity = isWinner && (animationPhase === 'revealing' || animationPhase === 'result') ? 0.8 : 0.15

  // Memoize geometries for performance
  const cardGeometry = useMemo<[number, number, number]>(() => [2.5, 1.5, 0.1], [])
  const glowGeometry = useMemo<[number, number, number]>(() => [2.52, 1.52, 0.09], [])

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      <RoundedBox args={cardGeometry} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          envMapIntensity={1.5}
          clearcoat={1}
          ior={1.5}
          transparent
          opacity={opacity * 0.9}
          emissive={isWinner ? '#fbbf24' : '#a855f7'}
          emissiveIntensity={emissiveIntensity}
        />
      </RoundedBox>

      {/* Edge glow */}
      <RoundedBox args={glowGeometry} radius={0.11} smoothness={4}>
        <meshBasicMaterial
          color={isWinner ? '#fbbf24' : '#a855f7'}
          transparent
          opacity={opacity * 0.5}
          side={THREE.BackSide}
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
        font="/fonts/inter-medium.woff"
      >
        {text}
      </Text>
    </group>
  )
}
