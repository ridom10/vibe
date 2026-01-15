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

// Create a soft circular glitter texture with radial gradient
function createGlitterTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  // Create radial gradient for soft circular glow
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function Background() {
  const particlesRef = useRef<THREE.Points>(null)
  const isMobile = useIsMobile()

  // More particles but smaller for glitter effect
  const particleCount = isMobile ? 80 : 150

  // Create particle data with positions, sizes, and twinkle phases
  const { positions, sizes, twinklePhases, colors } = useMemo(() => {
    const random = seededRandom(12345)
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const twinklePhases = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)

    // Base cyan color #22d3ee = RGB(34, 211, 238)
    const baseR = 34 / 255
    const baseG = 211 / 255
    const baseB = 238 / 255

    for (let i = 0; i < particleCount; i++) {
      // Position in a larger spread
      positions[i * 3] = (random() - 0.5) * 40
      positions[i * 3 + 1] = (random() - 0.5) * 40
      positions[i * 3 + 2] = (random() - 0.5) * 30

      // Size between 0.03 and 0.08 as specified
      sizes[i] = 0.03 + random() * 0.05

      // Random twinkle phase for individual animation
      twinklePhases[i] = random() * Math.PI * 2

      // Slight color variation around cyan
      const variation = 0.1
      colors[i * 3] = baseR + (random() - 0.5) * variation
      colors[i * 3 + 1] = baseG + (random() - 0.5) * variation
      colors[i * 3 + 2] = baseB + (random() - 0.5) * variation
    }

    return { positions, sizes, twinklePhases, colors }
  }, [particleCount])

  // Create glitter texture
  const glitterTexture = useMemo(() => createGlitterTexture(), [])

  // Create geometry with all attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, sizes, colors])

  // Create custom shader material for individual particle twinkle
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: glitterTexture },
        twinklePhases: { value: twinklePhases }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vIndex;

        void main() {
          vColor = color;
          vIndex = float(gl_VertexID);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        uniform float time;
        varying vec3 vColor;
        varying float vIndex;

        void main() {
          // Individual twinkle based on particle index
          float twinkleSpeed = 1.5 + mod(vIndex * 0.37, 2.0);
          float twinklePhase = mod(vIndex * 1.618, 6.283);
          float twinkle = 0.4 + 0.6 * (0.5 + 0.5 * sin(time * twinkleSpeed + twinklePhase));

          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * twinkle, texColor.a * twinkle);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [glitterTexture, twinklePhases])

  useFrame((state) => {
    if (particlesRef.current) {
      // Slow gentle rotation as specified
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01

      // Update time uniform for twinkle animation
      const shaderMaterial = particlesRef.current.material as THREE.ShaderMaterial
      shaderMaterial.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <points ref={particlesRef} geometry={geometry} material={material} />
  )
}
