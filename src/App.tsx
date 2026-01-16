import { useState, useCallback, useRef, useEffect, useMemo, Component, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Scene from './components/Scene'
import SpinWheel from './components/SpinWheel'
import InputPanel from './components/InputPanel'
import ResultModal from './components/ResultModal'
import { useSound } from './hooks/useSound'
import { useHaptics } from './hooks/useHaptics'

type AppState = 'input' | 'spinning' | 'result'

// Error Boundary for 3D scene failures
interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class SceneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        zIndex: 50
      }}
    >
      {/* Pulsing placeholder */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.05) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          marginBottom: '24px'
        }}
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Loading vibes...
      </motion.p>
    </motion.div>
  )
}

// Error fallback component
function ErrorFallback() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        zIndex: 50
      }}
    >
      <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px', marginBottom: '16px' }}>
        Oops! Something went wrong.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#09090b',
          background: '#22d3ee',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer'
        }}
      >
        Refresh to try again
      </button>
    </div>
  )
}

// Undo toast component
function UndoToast({
  message,
  onUndo,
  onDismiss
}: {
  message: string
  onUndo: () => void
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(39, 39, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 200,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
      role="alert"
      aria-live="polite"
    >
      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
        {message}
      </span>
      <button
        onClick={onUndo}
        style={{
          padding: '6px 12px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#22d3ee',
          background: 'transparent',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Undo
      </button>
    </motion.div>
  )
}

function App() {
  const [options, setOptions] = useState<string[]>([])
  const [appState, setAppState] = useState<AppState>('input')
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [undoState, setUndoState] = useState<{ options: string[], show: boolean }>({ options: [], show: false })
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chimePlayedRef = useRef(false)
  const sound = useSound()
  const haptics = useHaptics()

  // Compute winner announcement for screen readers (derived state, not effect)
  const winnerAnnouncement = useMemo(() => {
    if (appState === 'result' && winnerIndex !== null && options[winnerIndex]) {
      return `The vibes have chosen: ${options[winnerIndex]}`
    }
    return null
  }, [appState, winnerIndex, options])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to clear options (with confirmation if options exist)
      if (e.key === 'Escape' && appState === 'input' && options.length > 0 && !isTransitioning) {
        if (window.confirm('Clear all options?')) {
          setUndoState({ options: [...options], show: true })
          setOptions([])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [appState, options, isTransitioning])

  const handleAddOption = useCallback((option: string) => {
    if (options.length < 12 && !isTransitioning) {
      setOptions(prev => [...prev, option])
      sound.playPop()
      haptics.addOption()
    }
  }, [options.length, isTransitioning, sound, haptics])

  const handleRemoveOption = useCallback((index: number) => {
    if (!isTransitioning) {
      setOptions(prev => prev.filter((_, i) => i !== index))
      haptics.removeOption()
    }
  }, [isTransitioning, haptics])

  const handleDecide = useCallback(() => {
    if (options.length < 2 || isTransitioning) return

    setIsTransitioning(true)
    setAppState('spinning')
    setWinnerIndex(null)
    chimePlayedRef.current = false  // Reset chime guard for new spin
    haptics.shuffleStart()

    // Winner is now determined by the wheel spin animation
    // The wheel will call onSpinComplete when done
  }, [options.length, isTransitioning, haptics])

  const handleWheelSpinComplete = useCallback((winner: number) => {
    // Guard against double-triggering
    if (chimePlayedRef.current) return
    chimePlayedRef.current = true

    setWinnerIndex(winner)

    // Brief pause before showing result modal
    setTimeout(() => {
      setAppState('result')
      setIsTransitioning(false)
      sound.playChime()
      haptics.winnerReveal()
    }, 500)
  }, [sound, haptics])

  const handleAnimationComplete = useCallback(() => {
    // Legacy handler for 3D animation - now handled by handleWheelSpinComplete
    // Keep for backwards compatibility with Scene component
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

    // Save options for undo
    setUndoState({ options: [...options], show: true })

    setAppState('input')
    setWinnerIndex(null)

    // Delay clearing options for graceful animation
    setTimeout(() => {
      setOptions([])
      setIsTransitioning(false)
    }, 300)
  }, [isTransitioning, options])

  const handleUndo = useCallback(() => {
    setOptions(undoState.options)
    setUndoState({ options: [], show: false })
  }, [undoState.options])

  const handleDismissUndo = useCallback(() => {
    setUndoState(prev => ({ ...prev, show: false }))
  }, [])

  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
  }, [])

  const winner = winnerIndex !== null ? options[winnerIndex] : null
  const isSpinning = appState === 'spinning'
  const showPanel = appState === 'input' && !isTransitioning

  // Show wheel during spinning state
  const showWheel = appState === 'spinning' || (appState === 'result' && winnerIndex !== null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SceneErrorBoundary fallback={<ErrorFallback />}>
        <Scene
          options={[]}
          isSpinning={false}
          winnerIndex={null}
          onAnimationComplete={handleAnimationComplete}
          onReady={handleSceneReady}
        />
      </SceneErrorBoundary>

      {/* Loading state */}
      <AnimatePresence>
        {!sceneReady && <LoadingSkeleton />}
      </AnimatePresence>

      {/* Spin Wheel - appears when user clicks Decide */}
      <AnimatePresence>
        {showWheel && options.length >= 2 && (
          <motion.div
            key="spin-wheel"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              pointerEvents: 'none'
            }}
          >
            <SpinWheel
              options={options}
              isSpinning={isSpinning}
              onSpinComplete={handleWheelSpinComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel with smooth slide/fade transition during shuffle */}
      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.div
            key="input-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            transition={{
              duration: 0.4
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
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

      {/* Undo toast */}
      <AnimatePresence>
        {undoState.show && (
          <UndoToast
            message="Options cleared"
            onUndo={handleUndo}
            onDismiss={handleDismissUndo}
          />
        )}
      </AnimatePresence>

      {/* Screen reader announcement for winner */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        {winnerAnnouncement}
      </div>

      {/* Title and controls in top right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          zIndex: 10
        }}
      >
        {/* Sound toggle button */}
        <motion.button
          onClick={sound.toggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={sound.enabled ? 'Mute sounds' : 'Enable sounds'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: sound.enabled ? '#22d3ee' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {sound.enabled ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
        </motion.button>

        <div style={{ textAlign: 'right' }}>
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
        </div>
      </motion.div>
    </div>
  )
}

export default App
