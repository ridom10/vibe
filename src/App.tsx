import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Scene from './components/Scene'
import InputPanel from './components/InputPanel'
import ResultModal from './components/ResultModal'

type AppState = 'input' | 'spinning' | 'result'

function App() {
  const [options, setOptions] = useState<string[]>([])
  const [appState, setAppState] = useState<AppState>('input')
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleAddOption = useCallback((option: string) => {
    if (options.length < 12 && !isTransitioning) {
      setOptions(prev => [...prev, option])
    }
  }, [options.length, isTransitioning])

  const handleRemoveOption = useCallback((index: number) => {
    if (!isTransitioning) {
      setOptions(prev => prev.filter((_, i) => i !== index))
    }
  }, [isTransitioning])

  const handleDecide = useCallback(() => {
    if (options.length < 2 || isTransitioning) return

    setIsTransitioning(true)
    setAppState('spinning')
    setWinnerIndex(null)

    // Spin for 3.5 seconds (matches shuffle animation) then pick a winner
    spinTimeoutRef.current = setTimeout(() => {
      const winner = Math.floor(Math.random() * options.length)
      setWinnerIndex(winner)
    }, 3500)
  }, [options.length, isTransitioning])

  const handleAnimationComplete = useCallback(() => {
    // Small delay before showing modal
    setTimeout(() => {
      setAppState('result')
      setIsTransitioning(false)
    }, 600)
  }, [])

  const handlePickAgain = useCallback(() => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setAppState('input')
    setWinnerIndex(null)

    // Allow time for graceful reset animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 400)
  }, [isTransitioning])

  const handleReset = useCallback(() => {
    if (isTransitioning) return

    setIsTransitioning(true)

    // Clear any pending timeouts
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current)
    }

    setAppState('input')
    setWinnerIndex(null)

    // Delay clearing options for graceful animation
    setTimeout(() => {
      setOptions([])
      setIsTransitioning(false)
    }, 300)
  }, [isTransitioning])

  const winner = winnerIndex !== null ? options[winnerIndex] : null
  const isSpinning = appState === 'spinning'
  const showPanel = appState === 'input' && !isTransitioning

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Scene
        options={options}
        isSpinning={isSpinning}
        winnerIndex={winnerIndex}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Panel with fade transition during shuffle */}
      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.div
            key="input-panel"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.3,
              ease: 'easeOut'
            }}
          >
            <InputPanel
              options={options}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onDecide={handleDecide}
              isSpinning={isSpinning}
              disabled={isTransitioning}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ResultModal
        winner={winner}
        isVisible={appState === 'result'}
        onPickAgain={handlePickAgain}
        onReset={handleReset}
      />

      {/* Title in top right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          textAlign: 'right',
          zIndex: 10
        }}
      >
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: 'white',
          margin: 0
        }}>
          vibe
        </h1>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          margin: 0
        }}
        className="hidden sm:block"
        >
          let the vibes decide
        </p>
      </motion.div>
    </div>
  )
}

export default App
