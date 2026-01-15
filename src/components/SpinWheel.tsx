import { useRef, useEffect, useCallback, useState } from 'react'

interface SpinWheelProps {
  options: string[]
  onSpinComplete: (winnerIndex: number) => void
  isSpinning: boolean
}

// Color palette - dark zinc colors matching app background
const SEGMENT_COLORS = [
  '#18181b', // zinc-900
  '#27272a', // zinc-800
  '#1e1e21', // custom dark
  '#2a2a2e', // custom dark
  '#1a1a1d', // custom dark
  '#252529', // custom dark
]

const ACCENT_COLOR = '#22d3ee' // Cyan accent

export default function SpinWheel({ options, onSpinComplete, isSpinning }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const rotationRef = useRef(0)
  const spinStartTimeRef = useRef<number | null>(null)
  const targetRotationRef = useRef<number | null>(null)
  const hasCalledCompleteRef = useRef(false)

  const [dimensions, setDimensions] = useState({ width: 400, height: 400 })

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current
        const parentWidth = container.parentElement?.clientWidth || window.innerWidth
        const parentHeight = container.parentElement?.clientHeight || window.innerHeight
        const size = Math.min(parentWidth * 0.8, parentHeight * 0.7, 500)
        setDimensions({ width: size, height: size })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Draw the wheel
  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, rotation: number, winner: number | null, highlightAlpha: number) => {
    const dpr = window.devicePixelRatio || 1
    const canvas = ctx.canvas
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    const segmentAngle = (2 * Math.PI) / options.length

    // Add outer cyan glow effect
    ctx.shadowColor = 'rgba(34, 211, 238, 0.15)'
    ctx.shadowBlur = 30

    // Draw segments
    options.forEach((_, i) => {
      const startAngle = rotation + i * segmentAngle - Math.PI / 2
      const endAngle = startAngle + segmentAngle

      // Segment background
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Base color
      let fillColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length]

      // Winner highlight - blend toward cyan accent color
      if (winner === i && highlightAlpha > 0) {
        // Mix base color with cyan accent
        const r = parseInt(fillColor.slice(1, 3), 16)
        const g = parseInt(fillColor.slice(3, 5), 16)
        const b = parseInt(fillColor.slice(5, 7), 16)
        const ar = 34  // accent: #22d3ee -> rgb(34, 211, 238)
        const ag = 211
        const ab = 238

        const mr = Math.round(r + (ar - r) * highlightAlpha * 0.3)
        const mg = Math.round(g + (ag - g) * highlightAlpha * 0.3)
        const mb = Math.round(b + (ab - b) * highlightAlpha * 0.3)

        fillColor = `rgb(${mr}, ${mg}, ${mb})`
      }

      ctx.fillStyle = fillColor
      ctx.fill()

      // Subtle light segment dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    // Reset shadow for other elements
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Draw center circle - dark with cyan glow
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.12, 0, 2 * Math.PI)
    ctx.fillStyle = '#09090b'
    ctx.fill()
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw text on segments
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    options.forEach((option, i) => {
      const angle = rotation + i * segmentAngle + segmentAngle / 2 - Math.PI / 2
      const textRadius = radius * 0.65

      ctx.save()
      ctx.translate(
        centerX + Math.cos(angle) * textRadius,
        centerY + Math.sin(angle) * textRadius
      )
      ctx.rotate(angle + Math.PI / 2)

      // Calculate font size based on text length and segment size
      const maxWidth = radius * 0.5
      const fontSize = Math.min(16, radius * 0.1)
      ctx.font = `500 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

      // Truncate text if needed
      let displayText = option
      let textWidth = ctx.measureText(displayText).width
      while (textWidth > maxWidth && displayText.length > 3) {
        displayText = displayText.slice(0, -1)
        textWidth = ctx.measureText(displayText + '...').width
      }
      if (displayText !== option) {
        displayText += '...'
      }

      // Text styling - light for dark background
      ctx.fillStyle = winner === i && highlightAlpha > 0
        ? `rgba(255, 255, 255, ${0.85 + highlightAlpha * 0.15})`
        : 'rgba(255, 255, 255, 0.85)'

      // Make winner text slightly bolder
      if (winner === i && highlightAlpha > 0) {
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
      }

      ctx.fillText(displayText, 0, 0)
      ctx.restore()
    })

    // Draw pointer at top
    const pointerHeight = 25
    const pointerWidth = 20

    ctx.beginPath()
    ctx.moveTo(centerX - pointerWidth / 2, 8)
    ctx.lineTo(centerX + pointerWidth / 2, 8)
    ctx.lineTo(centerX, 8 + pointerHeight)
    ctx.closePath()
    ctx.fillStyle = ACCENT_COLOR
    ctx.fill()

    // Pointer line extending to wheel
    ctx.beginPath()
    ctx.moveTo(centerX, 8 + pointerHeight)
    ctx.lineTo(centerX, centerY - radius + 5)
    ctx.strokeStyle = ACCENT_COLOR
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }, [options])

  // Easing function for natural deceleration
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  // Store callbacks in refs to avoid stale closure in animation loop
  const drawWheelRef = useRef(drawWheel)
  const onSpinCompleteRef = useRef(onSpinComplete)
  const optionsLengthRef = useRef(options.length)

  useEffect(() => {
    drawWheelRef.current = drawWheel
  }, [drawWheel])

  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete
  }, [onSpinComplete])

  useEffect(() => {
    optionsLengthRef.current = options.length
  }, [options.length])

  // Reset state when spin starts - using useLayoutEffect to run before paint
  const prevIsSpinning = useRef(isSpinning)
  useEffect(() => {
    if (isSpinning && !prevIsSpinning.current) {
      // Spin just started - reset via refs to avoid synchronous setState in effect
      hasCalledCompleteRef.current = false
      winnerIndexRef.current = null
      highlightOpacityRef.current = 0
    }
    prevIsSpinning.current = isSpinning
  }, [isSpinning])

  // Refs to track current values without triggering re-renders during animation
  const winnerIndexRef = useRef<number | null>(null)
  const highlightOpacityRef = useRef(0)

  // Start spinning when isSpinning becomes true
  useEffect(() => {
    if (isSpinning && options.length > 0) {
      // Calculate target rotation: multiple full spins + random final position
      const fullSpins = 4 + Math.random() * 2 // 4-6 full rotations
      const randomOffset = Math.random() * 2 * Math.PI
      const startRotation = rotationRef.current
      targetRotationRef.current = startRotation + fullSpins * 2 * Math.PI + randomOffset

      spinStartTimeRef.current = performance.now()

      // Animation loop defined inside useEffect to avoid stale closures
      const animate = () => {
        if (!canvasRef.current) return

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        const now = performance.now()
        const elapsed = now - (spinStartTimeRef.current || now)
        const duration = 3500 // 3.5 seconds total spin

        if (elapsed < duration) {
          // Calculate progress with easing
          const progress = easeOutCubic(elapsed / duration)
          const totalRotation = (targetRotationRef.current || 0) - startRotation

          rotationRef.current = startRotation + totalRotation * progress

          drawWheelRef.current(ctx, rotationRef.current, null, 0)
          animationRef.current = requestAnimationFrame(animate)
        } else {
          // Spin complete - snap to final position
          rotationRef.current = targetRotationRef.current || 0

          // Calculate winner based on final position
          const segmentAngle = (2 * Math.PI) / optionsLengthRef.current
          // Normalize rotation to 0-2π range
          let normalizedRotation = rotationRef.current % (2 * Math.PI)
          if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI

          // The pointer is at top (12 o'clock), segments start from top (12 o'clock)
          // Winner is the segment at the pointer position
          const adjustedAngle = (2 * Math.PI - normalizedRotation) % (2 * Math.PI)
          const winner = Math.floor(adjustedAngle / segmentAngle) % optionsLengthRef.current

          winnerIndexRef.current = winner
          drawWheelRef.current(ctx, rotationRef.current, winner, 0)

          // Trigger highlight animation
          if (!hasCalledCompleteRef.current) {
            hasCalledCompleteRef.current = true

            // Animate highlight
            let highlightStart: number | null = null
            const animateHighlight = (timestamp: number) => {
              if (!highlightStart) highlightStart = timestamp
              const highlightElapsed = timestamp - highlightStart
              const highlightDuration = 300

              const opacity = Math.min(1, highlightElapsed / highlightDuration)
              highlightOpacityRef.current = opacity

              const currentCtx = canvasRef.current?.getContext('2d')
              if (currentCtx) {
                drawWheelRef.current(currentCtx, rotationRef.current, winner, opacity)
              }

              if (highlightElapsed < highlightDuration) {
                requestAnimationFrame(animateHighlight)
              } else {
                // Animation complete, notify parent
                onSpinCompleteRef.current(winner)
              }
            }
            requestAnimationFrame(animateHighlight)
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSpinning, options.length])

  // Initial draw and redraw on options change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || options.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup canvas for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`

    drawWheel(ctx, rotationRef.current, winnerIndexRef.current, highlightOpacityRef.current)
  }, [options, dimensions, drawWheel])

  if (options.length === 0) return null

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  )
}
