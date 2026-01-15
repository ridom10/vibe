import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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

// easeOutElastic for satisfying bounce on winner
function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3
  if (x === 0) return 0
  if (x === 1) return 1
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1
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
  const rainbowRef = useRef<THREE.Mesh>(null)
  const sparklesRef = useRef<THREE.Points>(null)
  const trailRef = useRef<THREE.Points>(null)
  const startTimeRef = useRef(0)
  const completedRef = useRef(false)
  const callbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const isMobile = useIsMobile()
  const { size } = useThree()

  // Track mouse/touch for parallax
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }
      // Normalize to -1 to 1
      mouseRef.current.x = (clientX / size.width) * 2 - 1
      mouseRef.current.y = -(clientY / size.height) * 2 + 1
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
    }
  }, [size])

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

  // Create particle trail geometry
  const trailParticleCount = isMobile ? 10 : 15
  const trailGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(trailParticleCount * 3)
    const opacities = new Float32Array(trailParticleCount)
    // Initialize at origin
    for (let i = 0; i < trailParticleCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      opacities[i] = 1.0 - (i / trailParticleCount) // Fade out along trail
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
    return geo
  }, [trailParticleCount])

  // Trail particle update function
  const updateTrailParticles = useCallback((currentPos: THREE.Vector3, time: number) => {
    if (!trailRef.current) return
    const positions = trailRef.current.geometry.attributes.position as THREE.BufferAttribute

    // Shift particles back
    for (let i = trailParticleCount - 1; i > 0; i--) {
      positions.setXYZ(
        i,
        positions.getX(i - 1),
        positions.getY(i - 1),
        positions.getZ(i - 1)
      )
    }

    // Add some random offset for sparkle effect
    const jitterX = (Math.random() - 0.5) * 0.1
    const jitterY = (Math.random() - 0.5) * 0.1 + Math.sin(time * 5) * 0.05

    // Set first particle to current position with jitter
    positions.setXYZ(0, currentPos.x + jitterX, currentPos.y + jitterY, currentPos.z)
    positions.needsUpdate = true
  }, [trailParticleCount])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime
    const elapsed = (Date.now() - startTimeRef.current) / 1000

    if (animationPhase === 'idle') {
      // Gentle floating animation with parallax response
      const parallaxStrength = isMobile ? 0.1 : 0.15
      const parallaxX = mouseRef.current.x * parallaxStrength * (index % 2 === 0 ? 1 : -0.5)
      const parallaxY = mouseRef.current.y * parallaxStrength * 0.5

      groupRef.current.position.x = basePosition.x + parallaxX
      groupRef.current.position.y = basePosition.y + Math.sin(time * config.floatSpeed + index * 0.5) * config.floatAmplitude + parallaxY
      groupRef.current.position.z = basePosition.z
      groupRef.current.rotation.y = Math.sin(time * 0.3 + index) * config.rotationAmplitude + mouseRef.current.x * 0.02
      groupRef.current.rotation.x = Math.sin(time * 0.4 + index * 0.7) * (config.rotationAmplitude * 0.4) + mouseRef.current.y * 0.02
      groupRef.current.scale.setScalar(config.scale)

      // Update particle trail during idle
      updateTrailParticles(groupRef.current.position, time)
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
      // Winner appears with elastic bounce animation
      const appearProgress = Math.min(elapsed / 1.0, 1)  // Slightly longer for full elastic effect
      const elasticEased = easeOutElastic(appearProgress)

      groupRef.current.position.x = 0
      groupRef.current.position.z = 2

      // Elastic scale with satisfying bounce
      const targetScale = 1.2 * config.scale
      const scale = THREE.MathUtils.lerp(0, targetScale, elasticEased)
      groupRef.current.scale.setScalar(Math.max(scale, 0.01))

      // Gentle float after appearing
      if (appearProgress > 0.6) {
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

      // Animate winner sparkles
      if (sparklesRef.current) {
        const sparklePositions = sparklesRef.current.geometry.attributes.position
        for (let i = 0; i < sparklePositions.count; i++) {
          const angle = (i / sparklePositions.count) * Math.PI * 2 + time * 0.5
          const sparkleRadius = 1.4 + Math.sin(time * 2 + i) * 0.2
          sparklePositions.setXYZ(
            i,
            Math.cos(angle) * sparkleRadius,
            Math.sin(angle) * sparkleRadius * 0.6 + Math.sin(time * 3 + i * 0.5) * 0.15,
            0.15
          )
        }
        sparklePositions.needsUpdate = true
      }

      // Update golden particle trail for winner
      updateTrailParticles(groupRef.current.position, time)

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
      // Losers gracefully fade and shrink (not just disappear)
      const appearProgress = Math.min(elapsed / 0.8, 1)  // Slightly slower for grace
      const eased = 1 - Math.pow(1 - appearProgress, 3)  // Smoother easing

      const loserAngle = initialAngle
      const loserRadius = 2.5 * (isMobile ? 0.65 : 1)
      const targetX = Math.cos(loserAngle) * loserRadius
      const targetY = Math.sin(loserAngle) * 0.3 - 0.5
      const targetZ = -1 + Math.sin(loserAngle) * 0.5

      groupRef.current.position.x = THREE.MathUtils.lerp(0, targetX, eased)
      groupRef.current.position.y = THREE.MathUtils.lerp(0, targetY, eased)
      groupRef.current.position.z = THREE.MathUtils.lerp(2, targetZ, eased)

      // Graceful shrink with slight fade effect
      const targetLoserScale = 0.5 * config.scale
      const scale = THREE.MathUtils.lerp(0.1, targetLoserScale, eased)
      groupRef.current.scale.setScalar(Math.max(scale, 0.01))

      // Subtle rotation during transition
      groupRef.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.1, eased)

      if (appearProgress > 0.5) {
        groupRef.current.position.y += Math.sin(time * 0.8 + index) * 0.04
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
  const opacity = isLoserPhase ? 0.4 : 1  // Loser cards slightly more faded
  const glowColor = isWinnerPhase ? '#fbbf24' : '#22d3ee'

  // Create sparkle geometry for winner
  const sparkleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const sparkleCount = 12
    const positions = new Float32Array(sparkleCount * 3)
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2
      positions[i * 3] = Math.cos(angle) * 1.4
      positions[i * 3 + 1] = Math.sin(angle) * 0.8
      positions[i * 3 + 2] = 0.15
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

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

      {/* Rainbow refraction edge - subtle iridescent effect on all cards */}
      <mesh ref={rainbowRef} position={[0, 0, 0.04]}>
        <RoundedBox args={[2.45, 1.45, 0.01]} radius={0.16} smoothness={4}>
          <meshBasicMaterial
            color={isWinnerPhase ? '#ffd700' : '#88ffff'}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </RoundedBox>
      </mesh>

      {/* Main glass card - premium glass material with iridescence */}
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
          envMapIntensity={2.5}
          clearcoat={1}
          clearcoatRoughness={0.02}
          ior={1.5}
          emissive={glowColor}
          emissiveIntensity={isWinnerPhase ? 0.5 : 0.2}
          iridescence={isWinnerPhase ? 1.0 : 0.5}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 400]}
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

      {/* Winner sparkle/particle trail effect */}
      {isWinnerPhase && (
        <points ref={sparklesRef} geometry={sparkleGeometry}>
          <pointsMaterial
            color="#ffd700"
            size={0.12}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}

      {/* Particle trail - subtle sparkles following the card */}
      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial
          color={isWinnerPhase ? '#ffd700' : '#88ddff'}
          size={isWinnerPhase ? 0.08 : 0.05}
          transparent
          opacity={isWinnerPhase ? 0.7 : 0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

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
