import { ArrowUpRight, Store } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { ResearchItem } from '../types/research'
import { VerdictBadge } from './VerdictBadge'

export function ResearchCard({ item }: { item: ResearchItem }) {
  return (
    <article className="research-card">
      <div className="product-visual" style={{ '--card-accent': item.accent } as CSSProperties}>
        <span>{item.name.slice(0, 2).toUpperCase()}</span>
      </div>
      <div className="research-card-body">
        <div className="card-meta"><span>{item.category}</span><span>&bull;</span><span>{item.updatedAt}</span></div>
        <h3>{item.name}</h3>
        <p>{item.summary}</p>
        <div className="card-platform"><Store size={14} />{item.platform}</div>
        <div className="card-numbers">
          <div><span>Harga</span><strong>{item.price}</strong></div>
          <div><span>Anggaran komisen</span><strong>{item.commission}</strong></div>
        </div>
        <div className="card-footer">
          <VerdictBadge verdict={item.verdict} />
          <Link to={`/research/${item.id}`}>Buka research <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  )
}
