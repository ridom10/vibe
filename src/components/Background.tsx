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
  gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.9)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)')
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

  // Increased particle count: 200 desktop / 100 mobile for magical effect
  const particleCount = isMobile ? 100 : 200

  // Create particle data with positions, sizes, and twinkle phases
  const { positions, sizes, twinklePhases, colors, isStar } = useMemo(() => {
    const random = seededRandom(12345)
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const twinklePhases = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)
    const isStar = new Float32Array(particleCount) // 1.0 for star, 0.0 for regular

    // Base cyan color #22d3ee = RGB(34, 211, 238)
    const baseR = 34 / 255
    const baseG = 211 / 255
    const baseB = 238 / 255

    for (let i = 0; i < particleCount; i++) {
      // Position spread - particles in FRONT of cards (z: 5-15)
      positions[i * 3] = (random() - 0.5) * 35
      positions[i * 3 + 1] = (random() - 0.5) * 35
      // Z position between 5 and 15 to be in front of cards
      positions[i * 3 + 2] = 5 + random() * 10

      // 10% are larger "star" particles, rest are regular glitter
      const isStarParticle = random() < 0.1
      isStar[i] = isStarParticle ? 1.0 : 0.0

      if (isStarParticle) {
        // Star particles: size 0.2-0.3 for visibility
        sizes[i] = 0.2 + random() * 0.1
      } else {
        // Regular glitter: size 0.08-0.15 (increased from 0.03-0.08)
        sizes[i] = 0.08 + random() * 0.07
      }

      // Random twinkle phase for individual animation
      twinklePhases[i] = random() * Math.PI * 2

      // Color variation - stars can be slightly warmer (gold-ish)
      const variation = 0.15
      if (isStarParticle) {
        // Stars: slightly warmer white/gold tint
        colors[i * 3] = 1.0  // Full red for warmer tone
        colors[i * 3 + 1] = 0.95
        colors[i * 3 + 2] = 0.85
      } else {
        // Regular: cyan with variation
        colors[i * 3] = baseR + (random() - 0.5) * variation
        colors[i * 3 + 1] = baseG + (random() - 0.5) * variation
        colors[i * 3 + 2] = baseB + (random() - 0.5) * variation
      }
    }

    return { positions, sizes, twinklePhases, colors, isStar }
  }, [particleCount])

  // Create glitter texture
  const glitterTexture = useMemo(() => createGlitterTexture(), [])

  // Create geometry with all attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('isStar', new THREE.BufferAttribute(isStar, 1))
    return geo
  }, [positions, sizes, colors, isStar])

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
        attribute float isStar;
        varying vec3 vColor;
        varying float vIndex;
        varying float vIsStar;

        void main() {
          vColor = color;
          vIndex = float(gl_VertexID);
          vIsStar = isStar;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Larger base multiplier for more visible particles
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        uniform float time;
        varying vec3 vColor;
        varying float vIndex;
        varying float vIsStar;

        void main() {
          // Individual twinkle based on particle index
          // More dramatic twinkle: opacity varies from 0.2 to 1.0
          float twinkleSpeed = 1.5 + mod(vIndex * 0.37, 2.5);
          float twinklePhase = mod(vIndex * 1.618, 6.283);

          // Stars twinkle slower but more dramatically
          float starMultiplier = vIsStar > 0.5 ? 0.7 : 1.0;
          float baseOpacity = vIsStar > 0.5 ? 0.3 : 0.2;

          // Twinkle between baseOpacity and 1.0
          float twinkle = baseOpacity + (1.0 - baseOpacity) * (0.5 + 0.5 * sin(time * twinkleSpeed * starMultiplier + twinklePhase));

          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * twinkle * 1.2, texColor.a * twinkle);
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
