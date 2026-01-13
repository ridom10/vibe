import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useMemo, useState } from 'react'
import Background from './Background'
import FloatingCard from './FloatingCard'
import ShatterEffect from './ShatterEffect'
import type { AnimationPhase } from '../hooks/useAnimationTimeline'

interface SceneProps {
  options: string[]
  animationPhase: AnimationPhase
  winnerIndex: number | null
}

export default function Scene({ options, animationPhase, winnerIndex }: SceneProps) {
  const [dpr, setDpr] = useState(1.5)

  // Calculate positions for shatter effects
  const cardPositions = useMemo(() => {
    return options.map((_, index) => {
      const total = options.length
      const initialAngle = (index / total) * Math.PI * 2
      const radius = Math.min(3 + total * 0.3, 5)
      return [
        Math.cos(initialAngle) * radius,
        Math.sin(initialAngle) * 0.5,
        Math.sin(initialAngle) * radius
      ] as [number, number, number]
    })
  }, [options])

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={dpr}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
        />
        {/* 3-point lighting for glass reflections */}
        <ambientLight intensity={0.3} />

        {/* Key light - main illumination */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          color="#ffffff"
        />

        {/* Fill light - soften shadows */}
        <directionalLight
          position={[-5, 3, -5]}
          intensity={0.8}
          color="#a855f7"
        />

        {/* Back light - edge definition */}
        <directionalLight
          position={[0, -3, -8]}
          intensity={1}
          color="#3b82f6"
        />

        {/* Accent light for drama */}
        <pointLight position={[0, 10, 0]} intensity={1.2} color="#ec4899" />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Background />

        {options.map((option, index) => (
          <FloatingCard
            key={`${option}-${index}`}
            text={option}
            index={index}
            total={options.length}
            animationPhase={animationPhase}
            isWinner={winnerIndex === index}
          />
        ))}

        {/* Shatter effects for non-winners */}
        {animationPhase === 'revealing' && winnerIndex !== null && options.map((_, index) => {
          if (index === winnerIndex) return null
          return (
            <ShatterEffect
              key={`shatter-${index}`}
              position={cardPositions[index]}
              color="#a855f7"
              shouldShatter={true}
            />
          )
        })}

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.8}
          />
        </EffectComposer>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
          autoRotate={animationPhase === 'idle' && options.length > 0}
          autoRotateSpeed={0.5}
        />
      </Suspense>
    </Canvas>
  )
}
