import { useState, type KeyboardEvent } from 'react'
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        position: 'absolute',
        left: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '340px',
        padding: '28px',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      <h2 style={{
        fontSize: '26px',
        fontWeight: '700',
        marginBottom: '6px',
        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
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

      {/* Pill-shaped input with circular add button */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <motion.div
          style={{
            flex: 1,
            position: 'relative'
          }}
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)'
              : '0 0 0 rgba(168, 85, 247, 0)'
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
              padding: '14px 20px',
              fontSize: '15px',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.06)',
              border: isFocused
                ? '1px solid rgba(168, 85, 247, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50px',
              outline: 'none',
              transition: 'all 0.2s ease'
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
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: inputValue.trim()
              ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '24px',
            fontWeight: '300',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: inputValue.trim()
              ? '0 4px 15px rgba(168, 85, 247, 0.4)'
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
        marginBottom: '20px',
        minHeight: options.length > 0 ? '40px' : '0',
        maxHeight: '160px',
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
                delay: index * 0.05 // Stagger animation
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                fontSize: '14px',
                color: 'white'
              }}
            >
              <span style={{
                maxWidth: '120px',
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
                  justifyContent: 'center'
                }}
              >
                ×
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {options.length === 0 && (
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          Add at least 2 options to get started
        </p>
      )}

      {options.length === 1 && (
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          Add one more option
        </p>
      )}

      {/* Gradient button with pulse */}
      <motion.button
        onClick={onDecide}
        disabled={!canDecide}
        whileHover={canDecide ? { scale: 1.02 } : {}}
        whileTap={canDecide ? { scale: 0.98 } : {}}
        animate={canDecide ? {
          boxShadow: [
            '0 4px 20px rgba(168, 85, 247, 0.4)',
            '0 4px 30px rgba(168, 85, 247, 0.6)',
            '0 4px 20px rgba(168, 85, 247, 0.4)'
          ]
        } : {}}
        transition={canDecide ? {
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        } : {}}
        style={{
          width: '100%',
          padding: '16px 24px',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          background: canDecide
            ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #a855f7 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          backgroundSize: '200% 200%',
          border: 'none',
          borderRadius: '16px',
          cursor: canDecide ? 'pointer' : 'not-allowed',
          opacity: canDecide ? 1 : 0.5,
          transition: 'all 0.3s ease'
        }}
      >
        {isSpinning ? '✨ Deciding...' : '✨ Let the Vibes Decide'}
      </motion.button>
    </motion.div>
  )
}
