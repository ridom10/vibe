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

// Swipeable chip component with hover micro-animation
function SwipeableChip({
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
    ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.15)', 'rgba(63, 63, 70, 0.5)']
  )

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD && !disabled) {
      onRemove()
    }
  }

  return (
    <motion.div
      key={`${option}-${index}`}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.3, y: -20, rotate: 10 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05
      }}
      style={{
        position: 'relative',
        display: 'inline-flex'
      }}
    >
      {/* Red reveal with trash icon for swipe-to-delete */}
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
          Delete
        </motion.div>
      )}

      <motion.div
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileHover={!isMobile && !disabled ? {
          scale: 1.05,
          boxShadow: '0 0 12px rgba(34, 211, 238, 0.3)'
        } : {}}
        whileTap={!isMobile && !disabled ? { scale: 0.98 } : {}}
        style={{
          x,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: isMobile ? '6px 12px' : '8px 14px',
          background: isMobile ? background : 'rgba(63, 63, 70, 0.5)',
          borderRadius: '20px',
          border: '1px solid rgba(113, 113, 122, 0.5)',
          fontSize: isMobile ? '13px' : '14px',
          color: 'white',
          cursor: isMobile ? 'grab' : 'default',
          touchAction: 'pan-y',
          transition: 'box-shadow 0.2s ease'
        }}
      >
        <span style={{
          maxWidth: isMobile ? '80px' : '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {option}
        </span>
        {!isMobile && (
          <motion.button
            onClick={onRemove}
            disabled={disabled}
            whileHover={{ scale: 1.2, color: '#ef4444' }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              minHeight: '20px',
              transition: 'color 0.15s ease'
            }}
          >
            ×
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
  }

  const isMaxCapacity = options.length >= MAX_OPTIONS
  const canDecide = options.length >= 2 && !isSpinning && !disabled

  // Smart button text
  const getButtonText = () => {
    if (isSpinning) return 'Deciding...'
    if (options.length === 0) return 'Add at least 2 options'
    if (options.length === 1) return 'Add 1 more option'
    return 'Let the Vibes Decide'
  }

  // Responsive styles
  const panelStyle = isMobile ? {
    position: 'absolute' as const,
    left: '0',
    right: '0',
    bottom: '0',
    top: 'auto',
    transform: 'none',
    width: '100%',
    padding: '24px 20px',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    zIndex: 10,
    background: 'rgba(24, 24, 27, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)'
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
      initial={{ opacity: 0, y: isMobile ? 50 : 0, x: isMobile ? 0 : -50 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
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

      {/* Pill-shaped input with circular add button */}
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
              borderRadius: '50px'
            }}
            animate={{
              boxShadow: error
                ? '0 0 20px rgba(239, 68, 68, 0.4)'
                : isFocused
                  ? '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)'
                  : '0 0 0 rgba(34, 211, 238, 0)',
              x: shakeInput ? [0, -10, 10, -10, 10, 0] : 0
            }}
            transition={{
              boxShadow: { duration: 0.2 },
              x: { duration: 0.4 }
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
              placeholder={isMaxCapacity ? 'Maximum reached' : 'Enter an option...'}
              disabled={isSpinning || disabled || isMaxCapacity}
              style={{
                width: '100%',
                padding: isMobile ? '14px 18px' : '14px 20px',
                fontSize: '16px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.06)',
                border: error
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : isFocused
                    ? '1px solid rgba(34, 211, 238, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50px',
                outline: 'none',
                transition: 'all 0.2s ease',
                minHeight: isMobile ? '52px' : '48px',
                opacity: isMaxCapacity ? 0.5 : 1
              }}
            />
          </motion.div>

          {/* Circular add button with satisfying press animation */}
          <motion.button
            onClick={handleAdd}
            disabled={!inputValue.trim() || isSpinning || disabled || isMaxCapacity}
            whileHover={inputValue.trim() && !isMaxCapacity ? {
              scale: 1.1,
              boxShadow: '0 6px 20px rgba(34, 211, 238, 0.5)'
            } : {}}
            whileTap={inputValue.trim() && !isMaxCapacity ? {
              scale: 0.85,
              boxShadow: '0 2px 8px rgba(34, 211, 238, 0.3)'
            } : {}}
            aria-label="Add option"
            style={{
              width: isMobile ? '52px' : '48px',
              height: isMobile ? '52px' : '48px',
              minWidth: isMobile ? '52px' : '48px',
              borderRadius: '50%',
              border: 'none',
              background: inputValue.trim() && !isMaxCapacity
                ? '#22d3ee'
                : 'rgba(255, 255, 255, 0.1)',
              color: inputValue.trim() && !isMaxCapacity ? '#09090b' : 'white',
              fontSize: '24px',
              fontWeight: '300',
              cursor: inputValue.trim() && !isMaxCapacity ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: inputValue.trim() && !isMaxCapacity
                ? '0 4px 15px rgba(34, 211, 238, 0.4)'
                : 'none',
              transition: 'all 0.15s ease',
              opacity: isMaxCapacity ? 0.5 : 1
            }}
          >
            +
          </motion.button>
        </div>

        {/* Inline error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                color: '#ef4444',
                fontSize: '13px',
                marginLeft: '20px',
                fontWeight: '500'
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Option chips with stagger animation and swipe-to-delete on mobile */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: isMobile ? '16px' : '20px',
        minHeight: options.length > 0 ? '40px' : '0',
        maxHeight: isMobile ? '150px' : '160px',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative'
      }}>
        <AnimatePresence mode="popLayout">
          {options.map((option, index) => (
            <SwipeableChip
              key={`${option}-${index}`}
              option={option}
              index={index}
              onRemove={() => onRemoveOption(index)}
              disabled={isSpinning || disabled}
              isMobile={isMobile}
            />
          ))}
        </AnimatePresence>

        {/* Progress indicator (e.g., '7/12') */}
        {options.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              right: '4px',
              top: '-20px',
              fontSize: '11px',
              color: options.length >= MAX_OPTIONS ? '#ef4444' : 'rgba(255,255,255,0.4)',
              fontWeight: '500'
            }}
          >
            {options.length}/{MAX_OPTIONS}
          </motion.div>
        )}
      </div>

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

      {/* Solid cyan button with smart text and subtle pulse when ready */}
      <motion.button
        onClick={onDecide}
        disabled={!canDecide}
        whileHover={canDecide ? { scale: 1.02 } : {}}
        whileTap={canDecide ? { scale: 0.96 } : {}}
        aria-label={getButtonText()}
        animate={canDecide ? {
          boxShadow: [
            '0 4px 20px rgba(34, 211, 238, 0.4)',
            '0 6px 35px rgba(34, 211, 238, 0.65)',
            '0 4px 20px rgba(34, 211, 238, 0.4)'
          ],
          scale: [1, 1.015, 1]
        } : {}}
        transition={canDecide ? {
          boxShadow: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
        } : {}}
        style={{
          width: '100%',
          padding: isMobile ? '14px 20px' : '16px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: canDecide ? '#09090b' : 'white',
          background: canDecide
            ? '#22d3ee'
            : 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '16px',
          cursor: canDecide ? 'pointer' : 'not-allowed',
          opacity: canDecide ? 1 : 0.5,
          transition: 'background 0.3s ease, color 0.3s ease, opacity 0.3s ease',
          minHeight: isMobile ? '52px' : '48px'
        }}
      >
        {getButtonText()}
      </motion.button>
    </motion.div>
  )
}
