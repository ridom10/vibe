/* eslint-disable react-hooks/set-state-in-effect */
import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useRef, useLayoutEffect, useEffect } from 'react'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import { Environment, ContactShadows } from '@react-three/drei'
import { useDetectGPU } from '@react-three/drei'
import Background from './Background'
import FloatingCard from './FloatingCard'
import ShuffleCard from './ShuffleCard'
import WinnerParticles from './WinnerParticles'

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

export default function Scene({ options, isSpinning, winnerIndex, onAnimationComplete, onReady }: SceneProps) {
  const [showShuffle, setShowShuffle] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const shuffleCompleteRef = useRef(false)
  const prevIsSpinning = useRef(isSpinning)
  const prevWinnerIndex = useRef(winnerIndex)
  const isMobile = useIsMobile()

  // GPU detection for performance optimization
  const gpuInfo = useDetectGPU()
  // Lower tier = weaker GPU. Tier 0-1 should get reduced effects
  const isLowEndDevice = isMobile || (gpuInfo?.tier !== undefined && gpuInfo.tier <= 1)

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
      onCreated={onReady}
    >
      <Suspense fallback={null}>
        {/* Improved lighting for premium glass look */}
        <ambientLight intensity={isMobile ? 0.6 : 0.7} />
        <pointLight position={[5, 5, 5]} intensity={isMobile ? 0.8 : 1} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={isMobile ? 0.3 : 0.5} color="#22d3ee" />

        <Background />

        {/* Cards only appear when spinning starts - they fly in during merging phase */}
        {/* During input phase, only the starfield background is visible */}
        {isSpinning && !showShuffle && !showResult && options.map((option, index) => (
          <FloatingCard
            key={`${option}-${index}`}
            text={option}
            index={index}
            total={options.length}
            isSpinning={isSpinning}
            isWinner={false}
            animationPhase="merging"
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

        {/* Environment map for reflections - subtle preset */}
        <Environment preset="night" />

        {/* Subtle reflection plane below cards */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.3}
          scale={10}
          blur={2}
          far={4}
          color="#22d3ee"
        />

        {/* Post-processing effects - different setup based on device capability */}
        {isLowEndDevice ? (
          <EffectComposer>
            {/* Simplified bloom only on low-end devices for performance */}
            <Bloom
              intensity={showResult ? 0.6 : 0.4}
              luminanceThreshold={0.7}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        ) : (
          <EffectComposer>
            {/* Full bloom for soft glow on bright elements */}
            <Bloom
              intensity={showResult ? 0.8 : 0.5}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            {/* Depth of field - stronger during winner reveal for cinematic effect */}
            <DepthOfField
              focusDistance={showResult ? 0.01 : 0.02}
              focalLength={showResult ? 0.08 : 0.05}
              bokehScale={showResult ? 5 : 3}
            />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  )
}
