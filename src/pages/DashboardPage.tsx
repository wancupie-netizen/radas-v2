import { ArrowRight, BookOpenText, CircleCheck, Clock3, LoaderCircle, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LiveResearchCard } from '../components/LiveResearchCard'
import { listAdminResearch } from '../lib/research-admin'
import type { ResearchRow } from '../types/database'

export function DashboardPage() {
  const { profile } = useAuth()
  const [research, setResearch] = useState<ResearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listAdminResearch()
      .then((items) => { if (active) setResearch(items) })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Ringkasan tidak dapat dimuatkan.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const summary = useMemo(() => {
    const published = research.filter((item) => item.status === 'published')
    const suitable = published.filter((item) => item.verdict === 'layak_diuji')
    const pending = research.filter((item) => item.status === 'ai_generated' || item.status === 'in_review')
    const drafts = research.filter((item) => item.status === 'draft')
    const now = new Date()
    const publishedThisMonth = published.filter((item) => {
      if (!item.published_at) return false
      const date = new Date(item.published_at)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    })
    return { published, suitable, pending, drafts, publishedThisMonth }
  }, [research])

  const latest = summary.published.slice(0, 3)
  const suitableRate = summary.published.length === 0 ? 0 : Math.round((summary.suitable.length / summary.published.length) * 100)
  const firstName = profile?.full_name?.trim() || 'Admin'
  const focusTitle = summary.pending.length > 0
    ? `${summary.pending.length} research menunggu semakan`
    : summary.drafts.length > 0
      ? `${summary.drafts.length} draf sedia untuk dijana`
      : 'Editorial queue terkawal'
  const focusCopy = summary.pending.length > 0
    ? 'Semak fakta, verdict dan Affiliate Playbook sebelum research diterbitkan.'
    : summary.drafts.length > 0
      ? 'Lengkapkan maklumat produk dan hasilkan research menggunakan AI apabila bersedia.'
      : 'Tiada research yang memerlukan tindakan segera buat masa ini.'

  if (loading) return <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan ringkasan RADAS...</p></div>
  if (error) return <div className="library-state error"><p>{error}</p></div>

  return (
    <>
      <section className="page-heading heading-row">
        <div><span className="eyebrow">Research Operating System</span><h1>Selamat kembali, {firstName}.</h1><p>Tumpukan perhatian pada research yang membantu affiliate membuat keputusan.</p></div>
        <Link className="button button-primary" to="/admin"><Sparkles size={17} /> Research baharu</Link>
      </section>

      <section className="metric-grid" aria-label="Ringkasan workspace">
        <article className="metric-card"><span className="metric-icon teal"><BookOpenText size={20} /></span><div><span>Research diterbitkan</span><strong>{summary.published.length}</strong><small>{summary.publishedThisMonth.length} diterbitkan bulan ini</small></div></article>
        <article className="metric-card"><span className="metric-icon blue"><CircleCheck size={20} /></span><div><span>Layak diuji</span><strong>{summary.suitable.length}</strong><small>{suitableRate}% daripada research diterbitkan</small></div></article>
        <article className="metric-card"><span className="metric-icon amber"><Clock3 size={20} /></span><div><span>Menunggu semakan</span><strong>{summary.pending.length}</strong><small>{summary.drafts.length} draf belum dijana</small></div></article>
      </section>

      <section className="insight-banner">
        <div className="insight-icon"><Sparkles size={22} /></div>
        <div><span className="eyebrow">Fokus hari ini</span><h2>{focusTitle}</h2><p>{focusCopy}</p></div>
        <Link className="button button-secondary" to="/admin">Buka Admin Studio <ArrowRight size={16} /></Link>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Research terkini</span><h2>Research yang telah diterbitkan</h2></div><Link to="/research">Lihat semua <ArrowRight size={16} /></Link></div>
        {latest.length > 0
          ? <div className="research-grid">{latest.map((item) => <LiveResearchCard item={item} key={item.id} />)}</div>
          : <div className="library-state"><BookOpenText /><h2>Belum ada research diterbitkan</h2><p>Research akan muncul di sini selepas disemak dan diterbitkan oleh admin.</p></div>}
      </section>
    </>
  )
}