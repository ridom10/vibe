import { useState, type KeyboardEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InputPanelProps {
  options: string[]
  onAddOption: (option: string) => void
  onRemoveOption: (index: number) => void
  onDecide: () => void
  isSpinning: boolean
  disabled: boolean
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddOption(inputValue.trim())
      setInputValue('')
    }
  }

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddOption(inputValue.trim())
      setInputValue('')
    }
  }

  const canDecide = options.length >= 2 && !isSpinning && !disabled

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
        gap: '10px',
        marginBottom: isMobile ? '16px' : '20px',
        alignItems: 'center'
      }}>
        <motion.div
          style={{
            flex: 1,
            position: 'relative',
            borderRadius: '50px'
          }}
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)'
              : '0 0 0 rgba(34, 211, 238, 0)'
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter an option..."
            disabled={isSpinning || disabled}
            style={{
              width: '100%',
              padding: isMobile ? '14px 18px' : '14px 20px',
              fontSize: '16px',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.06)',
              border: isFocused
                ? '1px solid rgba(34, 211, 238, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50px',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: isMobile ? '52px' : '48px'
            }}
          />
        </motion.div>

        {/* Circular add button */}
        <motion.button
          onClick={handleAdd}
          disabled={!inputValue.trim() || isSpinning || disabled}
          whileHover={inputValue.trim() ? { scale: 1.1 } : {}}
          whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
          style={{
            width: isMobile ? '52px' : '48px',
            height: isMobile ? '52px' : '48px',
            minWidth: isMobile ? '52px' : '48px',
            borderRadius: '50%',
            border: 'none',
            background: inputValue.trim()
              ? '#22d3ee'
              : 'rgba(255, 255, 255, 0.1)',
            color: inputValue.trim() ? '#09090b' : 'white',
            fontSize: '24px',
            fontWeight: '300',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: inputValue.trim()
              ? '0 4px 15px rgba(34, 211, 238, 0.4)'
              : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          +
        </motion.button>
      </div>

      {/* Option chips with stagger animation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: isMobile ? '16px' : '20px',
        minHeight: options.length > 0 ? '40px' : '0',
        maxHeight: isMobile ? '150px' : '160px',
        overflowY: 'auto'
      }}>
        <AnimatePresence mode="popLayout">
          {options.map((option, index) => (
            <motion.div
              key={`${option}-${index}`}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '6px 12px' : '8px 14px',
                background: 'rgba(63, 63, 70, 0.5)',
                borderRadius: '20px',
                border: '1px solid rgba(113, 113, 122, 0.5)',
                fontSize: isMobile ? '13px' : '14px',
                color: 'white'
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
              <motion.button
                onClick={() => onRemoveOption(index)}
                disabled={isSpinning || disabled}
                whileHover={{ scale: 1.2 }}
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
                  minHeight: '20px'
                }}
              >
                ×
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {options.length === 0 && !isMobile && (
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          Add at least 2 options to get started
        </p>
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

      {/* Solid cyan button */}
      <motion.button
        onClick={onDecide}
        disabled={!canDecide}
        whileHover={canDecide ? { scale: 1.02 } : {}}
        whileTap={canDecide ? { scale: 0.98 } : {}}
        animate={canDecide ? {
          boxShadow: [
            '0 4px 20px rgba(34, 211, 238, 0.4)',
            '0 4px 30px rgba(34, 211, 238, 0.6)',
            '0 4px 20px rgba(34, 211, 238, 0.4)'
          ]
        } : {}}
        transition={canDecide ? {
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
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
          transition: 'all 0.3s ease',
          minHeight: isMobile ? '52px' : '48px'
        }}
      >
        {isSpinning ? 'Deciding...' : 'Let the Vibes Decide'}
      </motion.button>
    </motion.div>
  )
}
