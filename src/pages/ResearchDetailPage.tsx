import { ArrowLeft, ArrowUpRight, CheckCircle2, Lightbulb, LoaderCircle, PlayCircle, ShieldCheck, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublishedResearchBySlug } from '../lib/database'
import { getProductImageUrl } from '../lib/research-admin'
import type { ContentAngle, PlaybookStep } from '../lib/research-ai'
import type { ResearchRow } from '../types/database'

const verdictLabels = { layak_diuji: 'Layak Diuji', perlu_dipantau: 'Perlu Dipantau', tidak_disyorkan: 'Tidak Disyorkan' }
const integrityLabels = { reviewed: 'Disemak RADAS', limited_information: 'Maklumat Terhad', update_required: 'Perlu Dikemas Kini' }

export function ResearchDetailPage() {
  const { researchId } = useParams()
  const [item, setItem] = useState<ResearchRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getPublishedResearchBySlug(researchId ?? '').then((value) => { if (active) setItem(value) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [researchId])

  if (loading) return <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan research...</p></div>
  if (!item) return <section className="empty-state"><h1>Research tidak ditemui</h1><p>Research mungkin belum diterbitkan atau tidak tersedia untuk pelan anda.</p><Link to="/research">Kembali ke library</Link></section>

  const imageUrl = getProductImageUrl(item.product_image_path)
  const angles = item.content_angles as unknown as ContentAngle[]
  const playbook = item.execution_playbook as unknown as PlaybookStep[]
  const verifiedDate = item.last_verified_at ? new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium' }).format(new Date(item.last_verified_at)) : '-'

  return (
    <>
      <Link className="back-link" to="/research"><ArrowLeft /> Kembali ke Research Library</Link>
      <section className="live-detail-hero"><div className="live-detail-image">{imageUrl ? <img src={imageUrl} alt={item.product_name} /> : <span>{item.product_name.slice(0, 2).toUpperCase()}</span>}</div><div><span className="eyebrow">{item.category} &middot; {item.platform}</span><h1>{item.product_name}</h1><p>{item.research_snapshot}</p><div className="detail-badges"><span className={`verdict ${item.verdict === 'layak_diuji' ? 'positive' : item.verdict === 'perlu_dipantau' ? 'watch' : 'negative'}`}>{item.verdict ? verdictLabels[item.verdict] : 'Belum dinilai'}</span><span>{item.access_level.toUpperCase()}</span></div></div><a className="button button-primary" href={item.product_url} target="_blank" rel="noreferrer">Lihat produk <ArrowUpRight /></a></section>
      <section className="detail-stats"><div><span>Harga</span><strong>RM{Number(item.price).toFixed(2)}</strong></div><div><span>Anggaran komisen</span><strong>{item.commission_amount === null ? '-' : `RM${Number(item.commission_amount).toFixed(2)}`}</strong></div><div><span>Platform</span><strong>{item.platform}</strong></div></section>
      <div className="published-layout">
        <main className="published-main">
          <article className="content-panel"><span className="panel-icon"><Target /></span><div><span className="eyebrow">RADAS Verdict</span><h2>{item.verdict ? verdictLabels[item.verdict] : 'Belum dinilai'}</h2><p>{item.verdict_reason}</p></div></article>
          <article className="content-panel"><span className="panel-icon blue"><Lightbulb /></span><div><span className="eyebrow">Research Insight</span><h2>Kenapa produk ini perlu diperhatikan</h2><p>{item.research_insight}</p></div></article>
          <section className="affiliate-playbook"><div className="playbook-heading"><span className="eyebrow">Affiliate Playbook</span><h2>Daripada research kepada tindakan</h2><p>Panduan praktikal yang telah disemak oleh RADAS.</p></div><article className="playbook-feature"><Target /><div><span>Product Pain</span><p>{item.product_pain}</p></div></article><article className="playbook-feature"><CheckCircle2 /><div><span>Suitable For</span><div className="tag-list">{item.suitable_for.map((value) => <span key={value}>{value}</span>)}</div></div></article><div className="published-angle-grid">{angles.map((angle, index) => <article key={`${angle.title}-${index}`}><span>Content Angle {index + 1}</span><h3>{angle.title}</h3><strong>{angle.hook}</strong><p>{angle.rationale}</p></article>)}</div><div className="published-steps"><h3><PlayCircle /> Execution Playbook</h3>{playbook.map((step, index) => <article key={`${step.step}-${index}`}><b>{String(index + 1).padStart(2, '0')}</b><div><h4>{step.step}</h4><p>{step.action}</p><small>{step.notes}</small></div></article>)}</div></section>
        </main>
        <aside className="integrity-panel"><ShieldCheck /><span className="eyebrow">Research Integrity</span><h3>{integrityLabels[item.integrity_status]}</h3><dl><div><dt>Last verified</dt><dd>{verifiedDate}</dd></div><div><dt>Verified by</dt><dd>RADAS Editorial</dd></div><div><dt>Access</dt><dd>{item.access_level.toUpperCase()}</dd></div></dl><p>Maklumat harga dan komisen boleh berubah. Semak platform sebelum menghasilkan content.</p></aside>
      </div>
    </>
  )
}