import { motion, AnimatePresence } from 'framer-motion'

interface ResultModalProps {
  winner: string | null
  isVisible: boolean
  onPickAgain: () => void
  onReset: () => void
}

export default function ResultModal({
  winner,
  isVisible,
  onPickAgain,
  onReset
}: ResultModalProps) {
  return (
    <AnimatePresence>
      {isVisible && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 10, 26, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100
          }}
          onClick={onPickAgain}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{
              type: 'spring',
              damping: 18,
              stiffness: 200,
              delay: 0.1
            }}
            style={{
              padding: '48px 56px',
              textAlign: 'center',
              maxWidth: '90%',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '28px',
              boxShadow: `
                0 0 60px rgba(251, 191, 36, 0.25),
                0 0 100px rgba(251, 191, 36, 0.15),
                0 8px 32px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                fontWeight: '500'
              }}
            >
              ✨ The vibes have chosen ✨
            </motion.p>

            {/* Winner text with shimmer effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.4,
                type: 'spring',
                damping: 12,
                stiffness: 150
              }}
              style={{
                position: 'relative',
                marginBottom: '36px'
              }}
            >
              <h1
                style={{
                  fontSize: 'clamp(32px, 8vw, 52px)',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #fcd34d 50%, #f59e0b 70%, #fbbf24 100%)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 3s ease-in-out infinite',
                  margin: 0,
                  lineHeight: 1.2,
                  padding: '8px 0'
                }}
              >
                {winner}
              </h1>
              {/* Text glow effect */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '60%',
                  background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  pointerEvents: 'none',
                  zIndex: -1
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                display: 'flex',
                gap: '14px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              {/* Spin again button - glass style */}
              <motion.button
                onClick={onPickAgain}
                whileHover={{ scale: 1.05, boxShadow: '0 6px 30px rgba(168, 85, 247, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Spin Again
              </motion.button>

              {/* New vibes button - glass style */}
              <motion.button
                onClick={onReset}
                whileHover={{
                  scale: 1.05,
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✨ New Vibes
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
