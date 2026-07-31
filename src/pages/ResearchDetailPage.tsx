import { ArrowLeft, ArrowUpRight, CheckCircle2, Lightbulb, MessageSquareText, PlayCircle, ShoppingBag } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { VerdictBadge } from '../components/VerdictBadge'
import { getResearchById } from '../data/research'

export function ResearchDetailPage() {
  const { researchId } = useParams()
  const item = getResearchById(researchId)
  if (!item) return <section className="empty-state"><h1>Research tidak ditemui</h1><Link to="/research">Kembali ke library</Link></section>

  return (
    <>
      <Link className="back-link" to="/research"><ArrowLeft size={16} /> Kembali ke Research Library</Link>
      <section className="detail-hero">
        <div className="detail-visual" style={{ '--card-accent': item.accent } as CSSProperties}><span>{item.name.slice(0, 2).toUpperCase()}</span></div>
        <div className="detail-title"><span className="eyebrow">{item.category} &middot; {item.platform}</span><h1>{item.name}</h1><p>{item.summary}</p><div className="detail-badges"><VerdictBadge verdict={item.verdict} /><span>Dikemas kini {item.updatedAt}</span></div></div>
        <a className="button button-primary" href="#product-link">Lihat produk <ArrowUpRight size={16} /></a>
      </section>
      <section className="detail-stats"><div><span>Harga semasa</span><strong>{item.price}</strong></div><div><span>Anggaran komisen</span><strong>{item.commission}</strong></div><div><span>Platform</span><strong>{item.platform}</strong></div></section>
      <div className="detail-layout">
        <div className="detail-content">
          <article className="content-panel"><span className="panel-icon"><Lightbulb size={19} /></span><div><span className="eyebrow">Research insight</span><h2>Kenapa produk ini berpotensi</h2><p>Produk ini menyelesaikan masalah yang mudah dikenali dan hasil penggunaannya boleh ditunjukkan dengan cepat. Ini mengurangkan masa yang diperlukan untuk menerangkan manfaat dalam video pendek.</p><ul className="check-list"><li><CheckCircle2 />Pain point boleh difahami dalam beberapa saat</li><li><CheckCircle2 />Visual demonstrasi sesuai untuk format short-form</li><li><CheckCircle2 />Harga berada dalam julat pembelian impulsif</li></ul></div></article>
          <article className="content-panel"><span className="panel-icon blue"><PlayCircle size={19} /></span><div><span className="eyebrow">Execution playbook</span><h2>Sudut content yang disyorkan</h2><div className="playbook-list"><div><strong>01</strong><span><b>Masalah â†’ penyelesaian</b><small>Tunjukkan situasi sebenar sebelum memperkenalkan produk.</small></span></div><div><strong>02</strong><span><b>Demo penggunaan pantas</b><small>Fokus pada hasil visual tanpa penerangan yang panjang.</small></span></div><div><strong>03</strong><span><b>POV rutin harian</b><small>Letakkan produk dalam konteks kehidupan pengguna Malaysia.</small></span></div></div></div></article>
        </div>
        <aside className="detail-aside"><div className="aside-panel"><ShoppingBag size={20} /><h3>Sesuai untuk</h3><div className="tag-list"><span>Content demo</span><span>POV harian</span><span>UGC review</span><span>Problem solving</span></div></div><div className="aside-panel"><MessageSquareText size={20} /><h3>Nota editorial</h3><p>Semak harga dan komisen pada platform sebelum menghasilkan content.</p></div></aside>
      </div>
    </>
  )
}