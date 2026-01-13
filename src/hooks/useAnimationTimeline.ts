import { useEffect, useRef } from 'react'

export const ANIMATION_TIMELINE = {
  SPIN_DURATION: 3000,        // 0.0s - 3.0s: Cards orbit/swirl
  SHATTER_DELAY: 500,          // 3.5s: Non-winners shatter (after 500ms deceleration)
  SHATTER_DURATION: 1000,      // 3.5s - 4.5s: Fragments fly and fade
  WINNER_ZOOM_START: 500,      // 4.0s: Winner zooms (starts at 3.5s + 500ms)
  WINNER_ZOOM_DURATION: 1000,  // Winner zoom takes 1s
  MODAL_DELAY: 1500            // 4.5s: Result modal (1.5s after shatter starts)
} as const

export type AnimationPhase = 'idle' | 'spinning' | 'revealing' | 'result'

interface UseAnimationTimelineProps {
  onPhaseChange: (phase: AnimationPhase) => void
  onWinnerSelected: (winnerIndex: number) => void
  optionsCount: number
}

export function useAnimationTimeline({
  onPhaseChange,
  onWinnerSelected,
  optionsCount
}: UseAnimationTimelineProps) {
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  const startAnimation = () => {
    clearAllTimeouts()
    onPhaseChange('spinning')

    // Select winner after spin duration
    const winnerTimeout = setTimeout(() => {
      const winner = Math.floor(Math.random() * optionsCount)
      onWinnerSelected(winner)
      onPhaseChange('revealing')
    }, ANIMATION_TIMELINE.SPIN_DURATION)

    // Show result modal
    const modalTimeout = setTimeout(() => {
      onPhaseChange('result')
    }, ANIMATION_TIMELINE.SPIN_DURATION + ANIMATION_TIMELINE.MODAL_DELAY)

    timeoutsRef.current = [winnerTimeout, modalTimeout]
  }

  const reset = () => {
    clearAllTimeouts()
    onPhaseChange('idle')
  }

  useEffect(() => {
    return () => clearAllTimeouts()
  }, [])

  return { startAnimation, reset }
}
