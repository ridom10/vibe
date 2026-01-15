import { useCallback } from 'react'

// Check if vibration API is available
function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

export interface HapticsControls {
  vibrate: (pattern: number | number[]) => void
  addOption: () => void
  removeOption: () => void
  shuffleStart: () => void
  winnerReveal: () => void
}

export function useHaptics(): HapticsControls {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (canVibrate()) {
      try {
        navigator.vibrate(pattern)
      } catch {
        // Vibration failed
      }
    }
  }, [])

  const addOption = useCallback(() => {
    vibrate(15) // 15ms short tap
  }, [vibrate])

  const removeOption = useCallback(() => {
    vibrate(40) // 40ms for delete
  }, [vibrate])

  const shuffleStart = useCallback(() => {
    vibrate(40) // 40ms for shuffle start
  }, [vibrate])

  const winnerReveal = useCallback(() => {
    vibrate([100, 50, 100]) // Pattern: vibrate 100ms, pause 50ms, vibrate 100ms
  }, [vibrate])

  return {
    vibrate,
    addOption,
    removeOption,
    shuffleStart,
    winnerReveal
  }
}
