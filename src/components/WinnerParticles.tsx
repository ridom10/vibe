import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WinnerParticlesProps {
  active: boolean
}

export default function WinnerParticles({ active }: WinnerParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const startTimeRef = useRef(0)
  const velocitiesRef = useRef<Float32Array | null>(null)

  const particleCount = 60

  const [positions, colors, velocities] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    const goldColor = new THREE.Color('#fbbf24')
    const purpleColor = new THREE.Color('#a855f7')
    const pinkColor = new THREE.Color('#ec4899')

    for (let i = 0; i < particleCount; i++) {
      // Start at center
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 2

      // Random outward velocity
      const angle = Math.random() * Math.PI * 2
      const upAngle = (Math.random() - 0.3) * Math.PI
      const speed = 2 + Math.random() * 3

      velocities[i * 3] = Math.cos(angle) * Math.cos(upAngle) * speed
      velocities[i * 3 + 1] = Math.sin(upAngle) * speed + 1
      velocities[i * 3 + 2] = Math.sin(angle) * Math.cos(upAngle) * speed

      // Mix of gold, purple, and pink colors
      const colorChoice = Math.random()
      let color: THREE.Color
      if (colorChoice < 0.5) {
        color = goldColor
      } else if (colorChoice < 0.8) {
        color = purpleColor
      } else {
        color = pinkColor
      }
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return [positions, colors, velocities]
  }, [])

  velocitiesRef.current = velocities

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

  useFrame((state) => {
    if (!particlesRef.current || !active) return

    if (startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime
      // Reset positions
      const posAttr = particlesRef.current.geometry.attributes.position
      for (let i = 0; i < particleCount; i++) {
        posAttr.setXYZ(i, 0, 0, 2)
      }
      posAttr.needsUpdate = true
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current
    const posAttr = particlesRef.current.geometry.attributes.position
    const vels = velocitiesRef.current

    if (!vels) return

    // Update particle positions with gravity and damping
    for (let i = 0; i < particleCount; i++) {
      const x = posAttr.getX(i)
      const y = posAttr.getY(i)
      const z = posAttr.getZ(i)

      const vx = vels[i * 3]
      const vy = vels[i * 3 + 1]
      const vz = vels[i * 3 + 2]

      // Apply velocity with gravity
      const gravity = -3
      const damping = 0.98
      const dt = 0.016

      const newY = y + vy * dt + gravity * dt * elapsed

      posAttr.setXYZ(
        i,
        x + vx * dt * damping,
        newY,
        z + vz * dt * damping
      )
    }

    posAttr.needsUpdate = true

    // Fade out over time
    const material = particlesRef.current.material as THREE.PointsMaterial
    const fadeProgress = Math.min(elapsed / 1.5, 1)
    material.opacity = 1 - fadeProgress
  })

  if (!active) {
    startTimeRef.current = 0
    return null
  }

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  )
}
