import { useState, type KeyboardEvent, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'

interface InputPanelProps {
  options: string[]
  onAddOption: (option: string) => void
  onRemoveOption: (index: number) => void
  onDecide: () => void
  isSpinning: boolean
  disabled: boolean
}

const MAX_OPTIONS = 12
const SWIPE_THRESHOLD = -80

// Clean vertical list item component with numbered badge
function OptionListItem({
  option,
  index,
  onRemove,
  disabled,
  isMobile
}: {
  option: string
  index: number
  onRemove: () => void
  disabled: boolean
  isMobile: boolean
}) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0])
  const deleteScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.5])
  const background = useTransform(
    x,
    [-100, -50, 0],
    ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.08)', 'transparent']
  )

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD && !disabled) {
      onRemove()
    }
  }

  return (
    <motion.div
      key={`${option}-${index}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.03
      }}
      style={{
        position: 'relative',
        marginBottom: '2px'
      }}
    >
      {/* Red reveal for swipe-to-delete on mobile */}
      {isMobile && (
        <motion.div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '12px',
            gap: '6px',
            opacity: deleteOpacity,
            scale: deleteScale,
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </motion.div>
      )}

      <motion.div
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileHover={!isMobile && !disabled ? {
          backgroundColor: 'rgba(34, 211, 238, 0.05)'
        } : {}}
        style={{
          x,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isMobile ? '10px 12px' : '12px 14px',
          background: isMobile ? background : 'transparent',
          borderRadius: '12px',
          touchAction: 'pan-y',
          transition: 'background-color 0.2s ease'
        }}
      >
        {/* Cyan numbered badge */}
        <div style={{
          width: '28px',
          height: '28px',
          minWidth: '28px',
          borderRadius: '8px',
          background: 'rgba(34, 211, 238, 0.15)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '600',
          color: '#22d3ee'
        }}>
          {index + 1}
        </div>

        {/* Option text - centered flex grow */}
        <span style={{
          flex: 1,
          fontSize: isMobile ? '14px' : '15px',
          color: 'white',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {option}
        </span>

        {/* Delete button on desktop */}
        {!isMobile && (
          <motion.button
            onClick={onRemove}
            disabled={disabled}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '28px',
              height: '28px',
              minWidth: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            ×
          </motion.button>
        )}
      </motion.div>

      {/* Subtle separator line */}
      <div style={{
        height: '1px',
        background: 'rgba(255, 255, 255, 0.06)',
        marginLeft: '52px',
        marginRight: isMobile ? '12px' : '14px'
      }} />
    </motion.div>
  )
}

// Cycling placeholder examples
const PLACEHOLDER_EXAMPLES = [
  'Pizza night...',
  'Beach vacation...',
  'Movie to watch...',
  'Restaurant choice...',
  'Weekend activity...',
  'Gift idea...'
]

export default function InputPanel({
  options,
  onAddOption,
  onRemoveOption,
  onDecide,
  isSpinning,
  disabled
}: InputPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shakeInput, setShakeInput] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cycle through placeholder examples every 3 seconds
  useEffect(() => {
    if (isFocused || inputValue) return // Don't cycle when focused or has value

    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_EXAMPLES.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isFocused, inputValue])

  // Clear error after 2 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Check for duplicate (case-insensitive)
  const isDuplicate = (value: string) => {
    return options.some(opt => opt.toLowerCase() === value.toLowerCase().trim())
  }

  const triggerShake = () => {
    setShakeInput(true)
    setTimeout(() => setShakeInput(false), 500)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = inputValue.trim()

      // Empty input shake
      if (!trimmed) {
        triggerShake()
        return
      }

      // Duplicate check
      if (isDuplicate(trimmed)) {
        setError('Already added!')
        triggerShake()
        return
      }

      // Max capacity check
      if (options.length >= MAX_OPTIONS) {
        setError('Maximum reached')
        triggerShake()
        return
      }

      onAddOption(trimmed)
      setInputValue('')
      setError(null)
    }
  }

  const handleAdd = () => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      triggerShake()
      return
    }

    if (isDuplicate(trimmed)) {
      setError('Already added!')
      triggerShake()
      return
    }

    if (options.length >= MAX_OPTIONS) {
      setError('Maximum reached')
      triggerShake()
      return
    }

    onAddOption(trimmed)
    setInputValue('')
    setError(null)

    // Trigger satisfying add animation
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 300)
  }

  const isMaxCapacity = options.length >= MAX_OPTIONS
  const canDecide = options.length >= 2 && !isSpinning && !disabled

  // Smart button text - engaging copy
  const getButtonText = () => {
    if (isSpinning) return 'Deciding...'
    if (options.length === 0) return 'Add at least 2 options'
    if (options.length === 1) return 'Add 1 more option'
    return 'Let the Vibes Decide'
  }

  // Responsive styles - mobile panel max 40% of screen height
  const panelStyle = isMobile ? {
    position: 'absolute' as const,
    left: '0',
    right: '0',
    bottom: '0',
    top: 'auto',
    transform: 'none',
    width: '100%',
    maxHeight: '40vh',
    padding: '16px 16px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'calc(16px + env(safe-area-inset-left, 0px))',
    paddingRight: 'calc(16px + env(safe-area-inset-right, 0px))',
    zIndex: 10,
    background: 'rgba(24, 24, 27, 0.97)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px 24px 0 0',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const
  } : {
    position: 'absolute' as const,
    left: '24px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '340px',
    padding: '28px',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 60 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      style={panelStyle}
    >
      {/* Mobile drag handle */}
      {isMobile && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '12px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px'
          }} />
        </div>
      )}

      {!isMobile && (
        <>
          <h2 style={{
            fontSize: '26px',
            fontWeight: '700',
            marginBottom: '6px',
            color: 'white'
          }}>
            Vibe Check
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '24px'
          }}>
            Add your options and let the vibes decide
          </p>
        </>
      )}

      {/* Premium input with pill-shaped Add button */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: isMobile ? '16px' : '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <motion.div
            style={{
              flex: 1,
              position: 'relative',
              borderRadius: '16px'
            }}
            animate={{
              boxShadow: error
                ? '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.15)'
                : isFocused
                  ? '0 0 25px rgba(34, 211, 238, 0.5), 0 0 50px rgba(34, 211, 238, 0.2)'
                  : justAdded
                    ? '0 0 30px rgba(34, 211, 238, 0.6)'
                    : '0 0 0 rgba(34, 211, 238, 0)',
              x: shakeInput ? [0, -8, 8, -8, 8, 0] : 0,
              scale: justAdded ? [1, 1.02, 1] : 1
            }}
            transition={{
              boxShadow: { duration: 0.25 },
              x: { duration: 0.4 },
              scale: { duration: 0.3 }
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isMaxCapacity ? 'Maximum reached' : PLACEHOLDER_EXAMPLES[placeholderIndex]}
              disabled={isSpinning || disabled || isMaxCapacity}
              style={{
                width: '100%',
                padding: isMobile ? '16px 20px' : '16px 22px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.06)',
                border: error
                  ? '2px solid rgba(239, 68, 68, 0.6)'
                  : isFocused
                    ? '2px solid rgba(34, 211, 238, 0.6)'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease, background 0.2s ease',
                minHeight: isMobile ? '56px' : '52px',
                opacity: isMaxCapacity ? 0.5 : 1
              }}
            />
          </motion.div>

          {/* Pill-shaped Add button - more obvious */}
          <motion.button
            onClick={handleAdd}
            disabled={!inputValue.trim() || isSpinning || disabled || isMaxCapacity}
            whileHover={inputValue.trim() && !isMaxCapacity ? {
              scale: 1.05,
              boxShadow: '0 6px 25px rgba(34, 211, 238, 0.5)'
            } : {}}
            whileTap={inputValue.trim() && !isMaxCapacity ? {
              scale: 0.92,
              boxShadow: '0 2px 10px rgba(34, 211, 238, 0.4)'
            } : {}}
            animate={{
              scale: justAdded ? [1, 0.9, 1.1, 1] : 1
            }}
            transition={{
              scale: { duration: 0.3 }
            }}
            aria-label="Add option"
            style={{
              padding: isMobile ? '16px 20px' : '14px 22px',
              minWidth: isMobile ? '80px' : '85px',
              height: isMobile ? '56px' : '52px',
              borderRadius: '14px',
              border: 'none',
              background: inputValue.trim() && !isMaxCapacity
                ? 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              color: inputValue.trim() && !isMaxCapacity ? '#09090b' : 'rgba(255,255,255,0.4)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: inputValue.trim() && !isMaxCapacity ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: inputValue.trim() && !isMaxCapacity
                ? '0 4px 20px rgba(34, 211, 238, 0.4)'
                : 'none',
              transition: 'all 0.2s ease',
              opacity: isMaxCapacity ? 0.5 : 1
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
            Add
          </motion.button>
        </div>

        {/* Inline error message with icon */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ef4444',
                fontSize: '13px',
                marginLeft: '4px',
                fontWeight: '500'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clean vertical options list */}
      {options.length > 0 && (
        <div style={{
          marginBottom: isMobile ? '16px' : '20px'
        }}>
          {/* Header with count */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            paddingLeft: '4px',
            paddingRight: '4px'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Your options
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: options.length >= MAX_OPTIONS ? '#ef4444' : '#22d3ee'
            }}>
              {options.length}/{MAX_OPTIONS}
            </span>
          </div>

          {/* Scrollable options list */}
          <div style={{
            maxHeight: isMobile ? '140px' : '180px',
            overflowY: 'auto',
            overflowX: 'hidden',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <AnimatePresence mode="popLayout">
              {options.map((option, index) => (
                <OptionListItem
                  key={`${option}-${index}`}
                  option={option}
                  index={index}
                  onRemove={() => onRemoveOption(index)}
                  disabled={isSpinning || disabled}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* First-time user hints with animated placeholder and quick-add examples */}
      {options.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '16px'
          }}
        >
          {/* Animated helpful placeholder */}
          <motion.div
            animate={{
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              textAlign: 'center',
              marginBottom: '16px'
            }}
          >
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              marginBottom: '4px'
            }}>
              ✨ What are you deciding?
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '12px'
            }}>
              Add 2+ options to let the vibes choose
            </p>
          </motion.div>

          <p style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            marginBottom: '12px'
          }}>
            Try these:
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {['Pizza', 'Burgers', 'Tacos'].map((example, idx) => (
              <motion.button
                key={example}
                onClick={() => onAddOption(example)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.08, background: 'rgba(34, 211, 238, 0.2)' }}
                whileTap={{ scale: 0.92 }}
                disabled={isSpinning || disabled}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#22d3ee',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                + {example}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {options.length === 1 && !isMobile && (
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          Add one more option
        </p>
      )}

      {/* Irresistible decide button with gradient and pulse */}
      <motion.button
        onClick={onDecide}
        disabled={!canDecide}
        whileHover={canDecide ? {
          scale: 1.02,
          boxShadow: '0 8px 40px rgba(34, 211, 238, 0.5), 0 8px 40px rgba(168, 85, 247, 0.3)'
        } : {}}
        whileTap={canDecide ? {
          scale: 0.96,
          boxShadow: '0 2px 15px rgba(34, 211, 238, 0.4)'
        } : {}}
        aria-label={getButtonText()}
        animate={canDecide ? {
          boxShadow: [
            '0 4px 25px rgba(34, 211, 238, 0.4), 0 4px 25px rgba(168, 85, 247, 0.2)',
            '0 8px 45px rgba(34, 211, 238, 0.6), 0 8px 45px rgba(168, 85, 247, 0.35)',
            '0 4px 25px rgba(34, 211, 238, 0.4), 0 4px 25px rgba(168, 85, 247, 0.2)'
          ],
          scale: [1, 1.02, 1]
        } : {}}
        transition={canDecide ? {
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        } : {}}
        style={{
          width: '100%',
          padding: isMobile ? '18px 24px' : '18px 28px',
          fontSize: isMobile ? '16px' : '17px',
          fontWeight: '700',
          letterSpacing: '0.02em',
          color: canDecide ? 'white' : 'rgba(255, 255, 255, 0.4)',
          background: canDecide
            ? 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)'
            : 'rgba(255, 255, 255, 0.08)',
          border: 'none',
          borderRadius: '16px',
          cursor: canDecide ? 'pointer' : 'not-allowed',
          opacity: canDecide ? 1 : 0.6,
          transition: 'opacity 0.3s ease',
          minHeight: isMobile ? '60px' : '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Sparkle icon */}
        {canDecide && (
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
          </motion.svg>
        )}
        {getButtonText()}
        {canDecide && (
          <motion.span
            animate={{
              opacity: [1, 0.6, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            ✨
          </motion.span>
        )}
      </motion.button>
    </motion.div>
  )
}
