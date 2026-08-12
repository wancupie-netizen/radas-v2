import { ArrowRight, Crown, Film, Lightbulb, LockKeyhole, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProductImageUrl } from '../lib/research-admin'
import type { ProResearchTeaser } from '../types/database'

function money(value: number | null) {
  return value === null ? '-' : new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(Number(value))
}

export function LockedProResearchCard({ item }: { item: ProResearchTeaser }) {
  const imageUrl = getProductImageUrl(item.product_image_path)

  return (
    <article className="research-card live-card pro-locked-card">
      <div className="product-visual">
        {imageUrl ? <img src={imageUrl} alt={item.product_name} /> : <span>{item.product_name.slice(0, 2).toUpperCase()}</span>}
        <span className="pro-card-badge"><Crown /> RADAS PRO</span>
      </div>
      <div className="research-card-body">
        <div className="card-meta"><span>{item.category}</span><span>&bull;</span><span><LockKeyhole /> PRO</span></div>
        <h3>{item.product_name}</h3>
        <div className="card-context"><span><Store />{item.platform}</span></div>
        <div className="card-numbers"><div><span>Harga</span><strong>{money(item.price)}</strong></div><div><span>Anggaran komisen</span><strong>{money(item.commission_amount)}</strong></div></div>
        <div className="pro-locked-features" aria-label="Kandungan RADAS PRO">
          <span><Lightbulb /> {item.content_angle_count} Content Angles</span>
          <span><Film /> {item.reference_video_count} Video Rujukan</span>
          <span><LockKeyhole /> Verdict &amp; Playbook</span>
        </div>
        <Link className="pro-unlock-link" to="/pro" aria-label={`Ketahui tentang RADAS PRO untuk membuka research ${item.product_name}`}>
          Buka dengan RADAS PRO <ArrowRight />
        </Link>
      </div>
    </article>
  )
}
