import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Simple seeded random for deterministic particle positions
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
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

export default function Background() {
  const particlesRef = useRef<THREE.Points>(null)
  const isMobile = useIsMobile()

  // Reduce particles on mobile for performance
  const particleCount = isMobile ? 60 : 100

  const positions = useMemo(() => {
    const random = seededRandom(12345)
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (random() - 0.5) * 50
      positions[i * 3 + 1] = (random() - 0.5) * 50
      positions[i * 3 + 2] = (random() - 0.5) * 50
    }
    return positions
  }, [particleCount])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.015
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.008

      // Subtle twinkle effect by modifying material opacity
      const material = particlesRef.current.material as THREE.PointsMaterial
      const time = state.clock.elapsedTime
      const baseOpacity = 0.4 + Math.sin(time * 0.5) * 0.15
      material.opacity = baseOpacity
    }
  })

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.1}
        color="#22d3ee"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}
