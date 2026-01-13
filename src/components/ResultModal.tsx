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
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 15, 35, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 100
          }}
          onClick={onPickAgain}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              delay: 0.1
            }}
            className="glass-strong glow-gold"
            style={{
              padding: '48px 64px',
              textAlign: 'center',
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
            >
              The vibes have chosen
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.4,
                type: 'spring',
                damping: 15
              }}
              style={{
                fontSize: '42px',
                fontWeight: '700',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(251, 191, 36, 0.3)'
              }}
            >
              {winner}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <motion.button
                onClick={onPickAgain}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Pick Again
              </motion.button>
              <motion.button
                onClick={onReset}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New Options
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
