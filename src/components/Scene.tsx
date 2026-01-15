import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Background from './Background'
import FloatingCard from './FloatingCard'

interface SceneProps {
  options: string[]
  isSpinning: boolean
  winnerIndex: number | null
  onAnimationComplete: () => void
}

export default function Scene({ options, isSpinning, winnerIndex, onAnimationComplete }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        {/* Soft ambient lighting */}
        <ambientLight intensity={0.6} />

        {/* Purple accent light from top-right */}
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#a855f7" />

        {/* Cyan accent light from bottom-left */}
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#06b6d4" />

        <Background />

        {options.map((option, index) => (
          <FloatingCard
            key={`${option}-${index}`}
            text={option}
            index={index}
            total={options.length}
            isSpinning={isSpinning}
            isWinner={winnerIndex === index}
            onAnimationComplete={index === 0 ? onAnimationComplete : undefined}
          />
        ))}
      </Suspense>
    </Canvas>
  )
}
