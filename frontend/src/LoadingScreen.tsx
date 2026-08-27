import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const MESSAGES = [
  'Analyzing your market…',
  'Tracking competitors…',
  'Checking AI visibility…',
  'Setting up tracking…',
]

const STEP_MS = 1400

type LoadingScreenProps = {
  onDone: () => void
}

const LoadingScreen = ({ onDone }: LoadingScreenProps) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= MESSAGES.length - 1) {
      const t = setTimeout(onDone, STEP_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [step, onDone])

  const progress = ((step + 1) / MESSAGES.length) * 100

  return (
    <div className="flex flex-col items-center justify-center min-h-[440px] gap-6 w-full">
      <div className="w-full max-w-[280px] h-1.5 rounded-full bg-[#242a33] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#ff4500]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: STEP_MS / 1000, ease: 'easeInOut' }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="text-[#9aa4b2] text-sm tracking-wide"
        >
          {MESSAGES[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export default LoadingScreen
