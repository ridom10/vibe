/* eslint-disable react-hooks/set-state-in-effect */
import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useRef, useLayoutEffect } from 'react'
import Background from './Background'
import FloatingCard from './FloatingCard'
import ShuffleCard from './ShuffleCard'
import WinnerParticles from './WinnerParticles'

interface SceneProps {
  options: string[]
  isSpinning: boolean
  winnerIndex: number | null
  onAnimationComplete: () => void
}

export default function Scene({ options, isSpinning, winnerIndex, onAnimationComplete }: SceneProps) {
  const [showShuffle, setShowShuffle] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const shuffleCompleteRef = useRef(false)
  const prevIsSpinning = useRef(isSpinning)
  const prevWinnerIndex = useRef(winnerIndex)

  // Use useLayoutEffect to update state synchronously before paint
  // This is intentional - we need to respond to prop changes immediately
  useLayoutEffect(() => {
    // Handle spinning start
    if (isSpinning && !prevIsSpinning.current) {
      setShowShuffle(false)
      setShowResult(false)
      setShowParticles(false)
      shuffleCompleteRef.current = false

      // Small delay for cards to start merging, then show shuffle card
      const timer = setTimeout(() => {
        setShowShuffle(true)
      }, 400)

      prevIsSpinning.current = isSpinning
      prevWinnerIndex.current = winnerIndex
      return () => clearTimeout(timer)
    }

    // Handle winner selected
    if (winnerIndex !== null && prevWinnerIndex.current === null && !shuffleCompleteRef.current) {
      shuffleCompleteRef.current = true
      setShowResult(true)
      setShowShuffle(false)
      setShowParticles(true)

      // Hide particles after animation
      const particleTimer = setTimeout(() => {
        setShowParticles(false)
      }, 1500)

      prevIsSpinning.current = isSpinning
      prevWinnerIndex.current = winnerIndex
      return () => clearTimeout(particleTimer)
    }

    // Handle reset
    if (!isSpinning && winnerIndex === null && (prevIsSpinning.current || prevWinnerIndex.current !== null)) {
      setShowShuffle(false)
      setShowResult(false)
      setShowParticles(false)
    }

    prevIsSpinning.current = isSpinning
    prevWinnerIndex.current = winnerIndex
  }, [isSpinning, winnerIndex])

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#a855f7" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#06b6d4" />

        <Background />

        {/* Show individual cards when not spinning or showing result */}
        {!showShuffle && !showResult && options.map((option, index) => (
          <FloatingCard
            key={`${option}-${index}`}
            text={option}
            index={index}
            total={options.length}
            isSpinning={isSpinning}
            isWinner={false}
            animationPhase={isSpinning ? 'merging' : 'idle'}
          />
        ))}

        {/* Shuffle card during spin animation */}
        {showShuffle && (
          <ShuffleCard
            options={options}
            onComplete={() => {}}
          />
        )}

        {/* Winner particle burst */}
        <WinnerParticles active={showParticles} />

        {/* Show result cards after winner is selected */}
        {showResult && options.map((option, index) => (
          <FloatingCard
            key={`result-${option}-${index}`}
            text={option}
            index={index}
            total={options.length}
            isSpinning={false}
            isWinner={winnerIndex === index}
            animationPhase={winnerIndex === index ? 'winner' : 'loser'}
            onAnimationComplete={index === winnerIndex ? onAnimationComplete : undefined}
          />
        ))}
      </Suspense>
    </Canvas>
  )
}
