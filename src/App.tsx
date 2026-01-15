import { useState, useCallback } from 'react'
import Scene from './components/Scene'
import InputPanel from './components/InputPanel'
import ResultModal from './components/ResultModal'

type AppState = 'input' | 'spinning' | 'result'

function App() {
  const [options, setOptions] = useState<string[]>([])
  const [appState, setAppState] = useState<AppState>('input')
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)

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

    // Spin for 3.5 seconds (matches shuffle animation) then pick a winner
    setTimeout(() => {
      const winner = Math.floor(Math.random() * options.length)
      setWinnerIndex(winner)
    }, 3500)
  }, [options.length])

  const handleAnimationComplete = useCallback(() => {
    // Small delay before showing modal
    setTimeout(() => {
      setAppState('result')
    }, 800)
  }, [])

  const handlePickAgain = useCallback(() => {
    setAppState('input')
    setWinnerIndex(null)
  }, [])

  const handleReset = useCallback(() => {
    setOptions([])
    setAppState('input')
    setWinnerIndex(null)
  }, [])

  const winner = winnerIndex !== null ? options[winnerIndex] : null
  const isSpinning = appState === 'spinning'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Scene
        options={options}
        isSpinning={isSpinning}
        winnerIndex={winnerIndex}
        onAnimationComplete={handleAnimationComplete}
      />

      <InputPanel
        options={options}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onDecide={handleDecide}
        isSpinning={isSpinning}
        disabled={appState === 'result'}
      />

      <ResultModal
        winner={winner}
        isVisible={appState === 'result'}
        onPickAgain={handlePickAgain}
        onReset={handleReset}
      />

      {/* Title in top right */}
      <div style={{
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
