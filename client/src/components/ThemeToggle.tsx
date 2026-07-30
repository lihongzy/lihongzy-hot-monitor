import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeToggle({
  onToggle,
}: {
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const { resolvedTheme } = useTheme()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={resolvedTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          onClick={onToggle}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={resolvedTheme}
              initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{resolvedTheme === 'dark' ? '浅色主题' : '深色主题'}</TooltipContent>
    </Tooltip>
  )
}
