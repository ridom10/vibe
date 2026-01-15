import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect } from 'react'
import Background from './Background'

interface SceneProps {
  options: string[]
  isSpinning: boolean
  winnerIndex: number | null
  onAnimationComplete: () => void
  onReady?: () => void
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

// Scene now only renders the starfield background
// The wheel spinner is rendered as a separate HTML5 Canvas overlay in App.tsx
export default function Scene({ onReady }: SceneProps) {
  const isMobile = useIsMobile()

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={onReady}
    >
      <Suspense fallback={null}>
        {/* Ambient lighting for starfield */}
        <ambientLight intensity={isMobile ? 0.6 : 0.7} />

        {/* Starfield background */}
        <Background />
      </Suspense>
    </Canvas>
  )
}
