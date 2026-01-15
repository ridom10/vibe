import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ShatterEffectProps {
  position: [number, number, number]
  color: string
  shouldShatter: boolean
  onComplete?: () => void
}

interface Fragment {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  rotationVelocity: THREE.Vector3
  opacity: number
}

// Seeded random number generator for deterministic values
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

// Pre-generate random values outside render
function generateFragmentData(fragmentCount: number, seed: number) {
  const random = createSeededRandom(seed)
  const cardWidth = 2.5
  const cardHeight = 1.5

  return Array.from({ length: fragmentCount }, () => {
    const x = (random() - 0.5) * cardWidth
    const y = (random() - 0.5) * cardHeight
    const size = 0.15 + random() * 0.15
    const angle = Math.atan2(y, x)
    const speed = 2 + random() * 3

    return {
      x,
      y,
      size,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed + random() * 2,
        z: (random() - 0.5) * 2
      },
      rotationVelocity: {
        x: (random() - 0.5) * 10,
        y: (random() - 0.5) * 10,
        z: (random() - 0.5) * 10
      }
    }
  })
}

function generateSparkData(sparkCount: number, seed: number) {
  const random = createSeededRandom(seed + 1000)
  return Array.from({ length: sparkCount }, () => ({
    x: (random() - 0.5) * 2,
    y: (random() - 0.5) * 1.5,
    z: random() * 0.5
  }))
}

export default function ShatterEffect({ position, color, shouldShatter, onComplete }: ShatterEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const fragmentsRef = useRef<Fragment[]>([])
  const startTimeRef = useRef(0)
  const hasStartedRef = useRef(false)

  // Use position as seed for deterministic random values
  const [seed] = useState(() => Math.abs(position[0] * 1000 + position[1] * 100 + position[2] * 10))

  // Detect mobile for performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const fragmentCount = isMobile ? 20 : 30

  // Pre-generated random data
  const fragmentData = useMemo(
    () => generateFragmentData(fragmentCount, seed),
    [fragmentCount, seed]
  )

  // Generate glass fragments
  const fragments = useMemo(() => {
    const frags: Fragment[] = []

    for (let i = 0; i < fragmentCount; i++) {
      const data = fragmentData[i]

      // Create small triangular geometry
      const geometry = new THREE.BufferGeometry()

      const vertices = new Float32Array([
        0, 0, 0,
        data.size, 0, 0,
        data.size * 0.5, data.size * 0.866, 0, // Equilateral triangle
      ])

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geometry.computeVertexNormals()

      const material = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.6,
        thickness: 0.3,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(data.x, data.y, 0)

      frags.push({
        mesh,
        velocity: new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z),
        rotationVelocity: new THREE.Vector3(data.rotationVelocity.x, data.rotationVelocity.y, data.rotationVelocity.z),
        opacity: 0.9
      })
    }

    return frags
  }, [fragmentCount, fragmentData, color])

  // Add fragments to scene
  useEffect(() => {
    if (!groupRef.current) return

    fragments.forEach(frag => {
      groupRef.current!.add(frag.mesh)
    })
    fragmentsRef.current = fragments

    return () => {
      fragments.forEach(frag => {
        frag.mesh.geometry.dispose()
        if (frag.mesh.material instanceof THREE.Material) {
          frag.mesh.material.dispose()
        }
      })
    }
  }, [fragments])

  // Start shatter animation
  useEffect(() => {
    if (shouldShatter && !hasStartedRef.current) {
      hasStartedRef.current = true
      startTimeRef.current = Date.now()
    }
  }, [shouldShatter])

  // Animate fragments
  useFrame(() => {
    if (!hasStartedRef.current || !groupRef.current) return

    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const duration = 1.0 // 1 second animation

    if (elapsed > duration) {
      // Animation complete
      fragmentsRef.current.forEach(frag => {
        frag.mesh.visible = false
      })
      onComplete?.()
      return
    }

    const progress = elapsed / duration

    fragmentsRef.current.forEach(frag => {
      // Apply velocity with gravity
      const gravity = -9.8
      const deltaTime = 0.016 // ~60fps

      frag.mesh.position.x += frag.velocity.x * deltaTime
      frag.mesh.position.y += frag.velocity.y * deltaTime + 0.5 * gravity * deltaTime * deltaTime
      frag.mesh.position.z += frag.velocity.z * deltaTime

      // Apply drag
      frag.velocity.multiplyScalar(0.98)
      frag.velocity.y += gravity * deltaTime

      // Apply rotation
      frag.mesh.rotation.x += frag.rotationVelocity.x * deltaTime
      frag.mesh.rotation.y += frag.rotationVelocity.y * deltaTime
      frag.mesh.rotation.z += frag.rotationVelocity.z * deltaTime

      // Fade out
      frag.opacity = 0.9 * (1 - progress)
      if (frag.mesh.material instanceof THREE.MeshPhysicalMaterial) {
        frag.mesh.material.opacity = frag.opacity
      }
    })
  })

  // Pre-generated spark data
  const sparkData = useMemo(
    () => isMobile ? null : generateSparkData(15, seed),
    [isMobile, seed]
  )

  // Add spark particles
  const sparks = useMemo(() => {
    if (!sparkData) return null

    const sparkCount = sparkData.length
    const sparkPositions = new Float32Array(sparkCount * 3)
    const sparkColors = new Float32Array(sparkCount * 3)
    const sparkColor = new THREE.Color(color)

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = sparkData[i].x
      sparkPositions[i * 3 + 1] = sparkData[i].y
      sparkPositions[i * 3 + 2] = sparkData[i].z

      sparkColors[i * 3] = sparkColor.r
      sparkColors[i * 3 + 1] = sparkColor.g
      sparkColors[i * 3 + 2] = sparkColor.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3))

    return geometry
  }, [color, sparkData])

  return (
    <group ref={groupRef} position={position}>
      {/* Spark particles */}
      {sparks && shouldShatter && (
        <points geometry={sparks}>
          <pointsMaterial
            size={0.1}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  )
}
