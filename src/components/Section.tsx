import { memo, ReactNode } from 'react'

interface Props {
  id: string
  title: string
  icon: string
  description?: string
  children: ReactNode
  isActive?: boolean
}

export const Section = memo(({ id, title, icon, description, children, isActive = true }: Props) => {
  if (!isActive) return null

  return (
    <section
      id={id}
      className="space-y-4 sm:space-y-6"
      aria-labelledby={`section-${id}-title`}
    >
      <header className="pb-3 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl" aria-hidden="true">{icon}</span>
          <div>
            <h2
              id={`section-${id}-title`}
              className="text-xl sm:text-2xl lg:text-3xl font-cyber text-neon-pink neon-glow tracking-wide"
            >
              {title}
            </h2>
            {description && (
              <p className="text-cyan-500 text-xs sm:text-sm mt-1 font-mono">{description}</p>
            )}
          </div>
        </div>
      </header>
      <div>{children}</div>
    </section>
  )
})
Section.displayName = 'Section'
