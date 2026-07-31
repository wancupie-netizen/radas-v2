import { ArrowUpRight, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProductImageUrl } from '../lib/research-admin'
import type { ResearchRow } from '../types/database'

const verdictLabels = { layak_diuji: 'Layak Diuji', perlu_dipantau: 'Perlu Dipantau', tidak_disyorkan: 'Tidak Disyorkan' }

function money(value: number | null) {
  return value === null ? '-' : new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(Number(value))
}

export function LiveResearchCard({ item }: { item: ResearchRow }) {
  const imageUrl = getProductImageUrl(item.product_image_path)
  const verdict = item.verdict ? verdictLabels[item.verdict] : 'Belum dinilai'
  return (
    <article className="research-card live-card">
      <div className="product-visual">{imageUrl ? <img src={imageUrl} alt={item.product_name} /> : <span>{item.product_name.slice(0, 2).toUpperCase()}</span>}</div>
      <div className="research-card-body">
        <div className="card-meta"><span>{item.category}</span><span>&bull;</span><span>{item.access_level.toUpperCase()}</span></div>
        <h3>{item.product_name}</h3>
        <p>{item.research_snapshot}</p>
        <div className="card-platform"><Store />{item.platform}</div>
        <div className="card-numbers"><div><span>Harga</span><strong>{money(item.price)}</strong></div><div><span>Anggaran komisen</span><strong>{money(item.commission_amount)}</strong></div></div>
        <div className="card-footer"><span className={`verdict ${item.verdict === 'layak_diuji' ? 'positive' : item.verdict === 'perlu_dipantau' ? 'watch' : 'negative'}`}>{verdict}</span><Link to={`/research/${item.slug}`}>Buka research <ArrowUpRight /></Link></div>
      </div>
    </article>
  )
}