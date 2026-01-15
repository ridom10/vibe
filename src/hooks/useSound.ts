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

// Generate a premium, satisfying winner chime - slot machine jackpot feel
function playChime(ctx: AudioContext) {
  const now = ctx.currentTime

  // 1. Rising whoosh sweep before the chord (0-0.2s)
  const sweepOsc = ctx.createOscillator()
  const sweepGain = ctx.createGain()
  sweepOsc.connect(sweepGain)
  sweepGain.connect(ctx.destination)
  sweepOsc.type = 'sine'
  sweepOsc.frequency.setValueAtTime(200, now)
  sweepOsc.frequency.exponentialRampToValueAtTime(800, now + 0.15)
  sweepGain.gain.setValueAtTime(0, now)
  sweepGain.gain.linearRampToValueAtTime(0.12, now + 0.08)
  sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
  sweepOsc.start(now)
  sweepOsc.stop(now + 0.2)

  // 2. Rich chord with 7th and octave harmonics (starts at 0.15s)
  // C5, E5, G5, B5 (7th), C6 (octave) - Cmaj7 with octave for richness
  const chordFrequencies = [
    { freq: 523.25, gain: 0.18 },  // C5 - root
    { freq: 659.25, gain: 0.15 },  // E5 - third
    { freq: 783.99, gain: 0.14 },  // G5 - fifth
    { freq: 987.77, gain: 0.10 },  // B5 - major 7th
    { freq: 1046.50, gain: 0.12 } // C6 - octave
  ]

  const chordStart = now + 0.15

  chordFrequencies.forEach(({ freq, gain }, index) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(freq, chordStart)

    // Stagger note entries slightly for arpeggio effect
    const noteStart = chordStart + index * 0.03
    gainNode.gain.setValueAtTime(0, noteStart)
    gainNode.gain.linearRampToValueAtTime(gain, noteStart + 0.04)
    gainNode.gain.setValueAtTime(gain, noteStart + 0.3)
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.9)

    oscillator.start(noteStart)
    oscillator.stop(noteStart + 0.95)
  })

  // 3. Reverb/delay echoes - quieter repeats for spaciousness
  const echoDelays = [0.1, 0.2, 0.35]
  const echoGains = [0.08, 0.04, 0.02]

  echoDelays.forEach((delay, i) => {
    const echoStart = chordStart + 0.5 + delay
    // Play just the root and fifth for echo clarity
    const echoFreqs = [523.25, 783.99]

    echoFreqs.forEach(freq => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, echoStart)

      gain.gain.setValueAtTime(0, echoStart)
      gain.gain.linearRampToValueAtTime(echoGains[i], echoStart + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, echoStart + 0.25)

      osc.start(echoStart)
      osc.stop(echoStart + 0.3)
    })
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
