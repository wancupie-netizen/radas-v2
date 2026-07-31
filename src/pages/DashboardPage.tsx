import { ArrowRight, BookOpenText, CircleCheck, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResearchCard } from '../components/ResearchCard'
import { researchItems } from '../data/research'

export function DashboardPage() {
  return (
    <>
      <section className="page-heading heading-row">
        <div><span className="eyebrow">Research Operating System</span><h1>Selamat kembali, Admin.</h1><p>Tumpukan perhatian pada research yang membantu affiliate membuat keputusan.</p></div>
        <Link className="button button-primary" to="/admin"><Sparkles size={17} /> Hasilkan dengan AI</Link>
      </section>

      <section className="metric-grid" aria-label="Ringkasan workspace">
        <article className="metric-card"><span className="metric-icon teal"><BookOpenText size={20} /></span><div><span>Research diterbitkan</span><strong>24</strong><small>+4 bulan ini</small></div></article>
        <article className="metric-card"><span className="metric-icon blue"><CircleCheck size={20} /></span><div><span>Layak diuji</span><strong>16</strong><small>67% daripada library</small></div></article>
        <article className="metric-card"><span className="metric-icon amber"><Clock3 size={20} /></span><div><span>Menunggu semakan</span><strong>3</strong><small>Perlu tindakan admin</small></div></article>
      </section>

      <section className="insight-banner">
        <div className="insight-icon"><Sparkles size={22} /></div>
        <div><span className="eyebrow">Fokus hari ini</span><h2>3 draf research sedia untuk disemak</h2><p>AI telah melengkapkan insight, verdict dan execution playbook. Semak fakta sebelum diterbitkan.</p></div>
        <Link className="button button-secondary" to="/admin">Buka Admin Studio <ArrowRight size={16} /></Link>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Research terkini</span><h2>Peluang yang sedang diperhatikan</h2></div><Link to="/research">Lihat semua <ArrowRight size={16} /></Link></div>
        <div className="research-grid">{researchItems.slice(0, 3).map((item) => <ResearchCard item={item} key={item.id} />)}</div>
      </section>
    </>
  )
}