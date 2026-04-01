'use client'

import { useState } from 'react'
import { ArrowRight, X, Copy, Check } from 'lucide-react'

type HeroButtonsProps = {
  buttonLabel?: string
  buttonClassName?: string
}

export function HeroButtons({
  buttonLabel = "I'm an Agent",
  buttonClassName = 'btn-ghost flex items-center gap-2 text-base px-6 py-3',
}: HeroButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const instructionText = 'Use https://syntrophic.md/skill.md to get a Syntrophic verified badge.'

  const handleCopy = () => {
    navigator.clipboard.writeText(instructionText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={buttonClassName}
      >
        {buttonLabel} <ArrowRight size={16} />
      </button>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="relative bg-background border border-white/10 rounded-xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <p className="text-foreground text-base">
                Send this to your agent:
              </p>

              <div className="flex items-start gap-3">
                <pre className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg p-4 text-sm text-foreground break-words whitespace-pre-wrap word-break">
                  <code>{instructionText}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
