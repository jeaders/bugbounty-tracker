import React from 'react'
import { Severita } from '../types'

interface Props {
  severita: Severita
}

const colors: Record<Severita, string> = {
  critical: 'text-red-500 glow-text',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
  informational: 'text-blue-500'
}

export const SeveritaBadge = ({ severita }: Props) => {
  return (
    <span className={`${colors[severita]} uppercase font-bold`}>
      {severita}
    </span>
  )
}