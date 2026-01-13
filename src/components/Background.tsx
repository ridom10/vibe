import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Seeded random for deterministic particle positions
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Generate particle data outside component
function generateParticleData(particleCount: number, seed: number) {
  const random = createSeededRandom(seed)
  const colorPalette = [
    new THREE.Color('#a855f7'), // purple
    new THREE.Color('#ec4899'), // pink
    new THREE.Color('#3b82f6'), // blue
    new THREE.Color('#8b5cf6'), // violet
  ]

  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (random() - 0.5) * 50
    positions[i * 3 + 1] = (random() - 0.5) * 50
    positions[i * 3 + 2] = (random() - 0.5) * 50

    const color = colorPalette[Math.floor(random() * colorPalette.length)]
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  return { positions, colors }
}

export default function Background() {
  const particlesRef = useRef<THREE.Points>(null)

  // Reduce particles on mobile for performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const particleCount = isMobile ? 250 : 500

  const { positions, colors } = useMemo(
    () => generateParticleData(particleCount, 42),
    [particleCount]
  )

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}
