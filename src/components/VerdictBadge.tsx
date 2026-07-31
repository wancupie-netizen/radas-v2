import { CircleCheck, Eye, ShieldAlert } from 'lucide-react'
import type { Verdict } from '../types/research'

const config = {
  'Layak Diuji': { icon: CircleCheck, className: 'positive' },
  'Perlu Dipantau': { icon: Eye, className: 'watch' },
  'Tidak Disyorkan': { icon: ShieldAlert, className: 'negative' },
} satisfies Record<Verdict, { icon: typeof CircleCheck; className: string }>

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const item = config[verdict]
  const Icon = item.icon
  return <span className={`verdict ${item.className}`}><Icon size={14} />{verdict}</span>
}