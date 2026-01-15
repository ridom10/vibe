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

// Create a soft circular star texture with radial gradient
function createStarTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  // Create radial gradient for soft circular glow
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)')
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

  // More particles for a beautiful starfield: 300 desktop / 150 mobile
  const particleCount = isMobile ? 150 : 300

  // Create particle data with positions, sizes, and colors
  const { positions, sizes, twinklePhases, colors, isStar } = useMemo(() => {
    const random = seededRandom(12345)
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const twinklePhases = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)
    const isStar = new Float32Array(particleCount) // 1.0 for bright star, 0.0 for regular

    // Color palette: cyan #22d3ee, purple #a855f7, white
    const cyan = { r: 34 / 255, g: 211 / 255, b: 238 / 255 }
    const purple = { r: 168 / 255, g: 85 / 255, b: 247 / 255 }
    const white = { r: 1, g: 1, b: 1 }

    for (let i = 0; i < particleCount; i++) {
      // CRITICAL FIX: Camera is at z=8, cards are at z=0-2
      // Particles must be BEHIND cards, so z=-15 to z=-3 (negative z is further back)
      // Spread particles wider: 50x50 area
      positions[i * 3] = (random() - 0.5) * 50
      positions[i * 3 + 1] = (random() - 0.5) * 50
      // Z position between -15 and -3 (BEHIND the cards)
      positions[i * 3 + 2] = -15 + random() * 12

      // 15% are larger "bright star" particles
      const isStarParticle = random() < 0.15
      isStar[i] = isStarParticle ? 1.0 : 0.0

      if (isStarParticle) {
        // Bright stars: size 0.15-0.4 for high visibility
        sizes[i] = 0.15 + random() * 0.25
      } else {
        // Regular stars: size 0.08-0.18
        sizes[i] = 0.08 + random() * 0.1
      }

      // Random twinkle phase for individual animation
      twinklePhases[i] = random() * Math.PI * 2

      // Color variation: 40% cyan, 30% purple, 30% white
      const colorChoice = random()
      if (colorChoice < 0.4) {
        // Cyan stars
        colors[i * 3] = cyan.r + (random() - 0.5) * 0.1
        colors[i * 3 + 1] = cyan.g + (random() - 0.5) * 0.1
        colors[i * 3 + 2] = cyan.b + (random() - 0.5) * 0.1
      } else if (colorChoice < 0.7) {
        // Purple stars
        colors[i * 3] = purple.r + (random() - 0.5) * 0.1
        colors[i * 3 + 1] = purple.g + (random() - 0.5) * 0.1
        colors[i * 3 + 2] = purple.b + (random() - 0.5) * 0.1
      } else {
        // White stars (with slight warm tint)
        colors[i * 3] = white.r
        colors[i * 3 + 1] = white.g - random() * 0.05
        colors[i * 3 + 2] = white.b - random() * 0.1
      }
    }

    return { positions, sizes, twinklePhases, colors, isStar }
  }, [particleCount])

  // Create star texture
  const starTexture = useMemo(() => createStarTexture(), [])

  // Create geometry with all attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('isStar', new THREE.BufferAttribute(isStar, 1))
    return geo
  }, [positions, sizes, colors, isStar])

  // Create custom shader material for beautiful twinkling stars
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: starTexture },
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
          // Much larger multiplier for highly visible stars
          gl_PointSize = size * (600.0 / -mvPosition.z);
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
          float twinkleSpeed = 1.2 + mod(vIndex * 0.37, 2.0);
          float twinklePhase = mod(vIndex * 1.618, 6.283);

          // Bright stars have higher base opacity, twinkle slower but more dramatically
          float baseOpacity = vIsStar > 0.5 ? 0.7 : 0.5;
          float twinkleRange = vIsStar > 0.5 ? 0.3 : 0.4;
          float starSpeed = vIsStar > 0.5 ? 0.6 : 1.0;

          // Twinkle effect with high minimum opacity for visibility
          float twinkle = baseOpacity + twinkleRange * sin(time * twinkleSpeed * starSpeed + twinklePhase);

          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          // Boost brightness significantly for magical effect
          float brightness = vIsStar > 0.5 ? 1.5 : 1.3;
          gl_FragColor = vec4(vColor * twinkle * brightness, texColor.a * twinkle * 1.2);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [starTexture, twinklePhases])

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
