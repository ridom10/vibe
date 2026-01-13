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
      className="glass input-panel-mobile"
      style={{
        position: 'absolute',
        left: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '320px',
        padding: '24px',
        zIndex: 10
      }}
    >
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '8px',
        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Vibe Check
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '20px'
      }}>
        Add your options and let the vibes decide
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter an option..."
          className="input-glass"
          style={{ flex: 1 }}
          disabled={isSpinning || disabled}
        />
        <button
          onClick={handleAdd}
          className="btn-secondary"
          disabled={!inputValue.trim() || isSpinning || disabled}
          style={{ padding: '14px 16px' }}
        >
          +
        </button>
      </div>

      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        <AnimatePresence mode="popLayout">
          {options.map((option, index) => (
            <motion.div
              key={`${option}-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span style={{
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: '10px'
              }}>
                {option}
              </span>
              <button
                onClick={() => onRemoveOption(index)}
                disabled={isSpinning || disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {options.length === 0 && (
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          Add at least 2 options to get started
        </p>
      )}

      {options.length === 1 && (
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          Add one more option
        </p>
      )}

      <motion.button
        onClick={onDecide}
        disabled={!canDecide}
        className="btn-primary"
        style={{ width: '100%' }}
        whileHover={canDecide ? { scale: 1.02 } : {}}
        whileTap={canDecide ? { scale: 0.98 } : {}}
      >
        {isSpinning ? 'Deciding...' : 'Let the Vibes Decide'}
      </motion.button>
    </motion.div>
  )
}
