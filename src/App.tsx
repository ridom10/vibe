import { useState, useCallback } from 'react'
import Scene from './components/Scene'
import InputPanel from './components/InputPanel'
import ResultModal from './components/ResultModal'
import { useAnimationTimeline, type AnimationPhase } from './hooks/useAnimationTimeline'

type AppState = 'input' | 'spinning' | 'result'

function App() {
  const [options, setOptions] = useState<string[]>([])
  const [appState, setAppState] = useState<AppState>('input')
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle')

  const handlePhaseChange = useCallback((phase: AnimationPhase) => {
    setAnimationPhase(phase)
    if (phase === 'result') {
      setAppState('result')
    }
  }, [])

  const handleWinnerSelected = useCallback((winner: number) => {
    setWinnerIndex(winner)
  }, [])

  const { startAnimation, reset } = useAnimationTimeline({
    onPhaseChange: handlePhaseChange,
    onWinnerSelected: handleWinnerSelected,
    optionsCount: options.length
  })

  const handleAddOption = useCallback((option: string) => {
    if (options.length < 12) {
      setOptions(prev => [...prev, option])
    }
  }, [options.length])

  const handleRemoveOption = useCallback((index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDecide = useCallback(() => {
    if (options.length < 2) return
    setAppState('spinning')
    setWinnerIndex(null)
    startAnimation()
  }, [options.length, startAnimation])

  const handlePickAgain = useCallback(() => {
    setAppState('input')
    setWinnerIndex(null)
    reset()
  }, [reset])

  const handleReset = useCallback(() => {
    setOptions([])
    setAppState('input')
    setWinnerIndex(null)
    reset()
  }, [reset])

  const winner = winnerIndex !== null ? options[winnerIndex] : null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Scene
        options={options}
        animationPhase={animationPhase}
        winnerIndex={winnerIndex}
      />

      <InputPanel
        options={options}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onDecide={handleDecide}
        isSpinning={animationPhase === 'spinning'}
        disabled={appState === 'result'}
      />

      <ResultModal
        winner={winner}
        isVisible={appState === 'result'}
        onPickAgain={handlePickAgain}
        onReset={handleReset}
      />

      {/* Title in top right */}
      <div className="app-title-mobile" style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        textAlign: 'right',
        zIndex: 10
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          vibe
        </h1>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          margin: 0
        }}>
          let the vibes decide
        </p>
      </div>
    </div>
  )
}

export default App
