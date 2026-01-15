import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Background() {
  const particlesRef = useRef<THREE.Points>(null)
  const opacitiesRef = useRef<Float32Array | null>(null)
  const twinklePhasesRef = useRef<Float32Array | null>(null)

  const particleCount = 200

  const [positions, colors, opacities, twinklePhases] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const opacities = new Float32Array(particleCount)
    const twinklePhases = new Float32Array(particleCount)

    const colorPalette = [
      new THREE.Color('#a855f7'), // purple
      new THREE.Color('#ec4899'), // pink
      new THREE.Color('#3b82f6'), // blue
      new THREE.Color('#8b5cf6'), // violet
    ]

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      opacities[i] = 0.3 + Math.random() * 0.5
      twinklePhases[i] = Math.random() * Math.PI * 2
    }
    return [positions, colors, opacities, twinklePhases]
  }, [])

  opacitiesRef.current = opacities
  twinklePhasesRef.current = twinklePhases

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

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
        size={0.12}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}
