import { useCallback, useEffect, useRef, useState } from 'react'

// localStorage key for sound preference
const SOUND_ENABLED_KEY = 'vibe-sound-enabled'

// Minimum time between chime plays (in ms) to prevent double triggers
// Set to 1000ms to account for the full animation + callback delay chain
const CHIME_DEBOUNCE_MS = 1000

// Create audio context lazily
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

// Generate a soft pop sound
function playPop(ctx: AudioContext) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.setValueAtTime(400, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.1)
}

// Generate a tick sound for shuffle
function playTick(ctx: AudioContext) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(800, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03)

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.03)
}

// Generate a pleasant chime for winner reveal
function playChime(ctx: AudioContext) {
  // Play a chord-like chime with multiple frequencies
  const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5 - C major chord

  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime)

    const startTime = ctx.currentTime + index * 0.05
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)

    oscillator.start(startTime)
    oscillator.stop(startTime + 0.8)
  })
}

export interface SoundControls {
  enabled: boolean
  toggle: () => void
  playPop: () => void
  playTick: () => void
  playChime: () => void
  startShuffleTicks: () => void
  stopShuffleTicks: () => void
}

export function useSound(): SoundControls {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(SOUND_ENABLED_KEY)
    return stored === null ? true : stored === 'true'
  })

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastChimeTimeRef = useRef<number>(0)

  // Persist preference
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
  }, [enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current)
      }
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => !prev)
  }, [])

  const handlePlayPop = useCallback(() => {
    if (!enabled) return
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      playPop(ctx)
    } catch {
      // Audio not supported
    }
  }, [enabled])

  const handlePlayTick = useCallback(() => {
    if (!enabled) return
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      playTick(ctx)
    } catch {
      // Audio not supported
    }
  }, [enabled])

  const handlePlayChime = useCallback(() => {
    if (!enabled) return

    // Guard against double-triggering (can happen due to re-renders or animation callbacks)
    const now = Date.now()
    if (now - lastChimeTimeRef.current < CHIME_DEBOUNCE_MS) {
      return
    }
    lastChimeTimeRef.current = now

    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      playChime(ctx)
    } catch {
      // Audio not supported
    }
  }, [enabled])

  const startShuffleTicks = useCallback(() => {
    if (!enabled) return
    // Play ticks rapidly during shuffle (every 100ms)
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current)
    }
    tickIntervalRef.current = setInterval(() => {
      handlePlayTick()
    }, 100)
  }, [enabled, handlePlayTick])

  const stopShuffleTicks = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current)
      tickIntervalRef.current = null
    }
  }, [])

  return {
    enabled,
    toggle,
    playPop: handlePlayPop,
    playTick: handlePlayTick,
    playChime: handlePlayChime,
    startShuffleTicks,
    stopShuffleTicks
  }
}
