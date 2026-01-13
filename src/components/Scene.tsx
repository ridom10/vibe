import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
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
      camera={{ position: [0, 0, 10], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        <spotLight
          position={[0, 10, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          color="#ec4899"
        />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
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
          autoRotate={!isSpinning && options.length > 0}
          autoRotateSpeed={0.5}
        />
      </Suspense>
    </Canvas>
  )
}
