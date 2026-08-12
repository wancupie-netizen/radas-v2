import { ArrowRight, CheckCircle2, Crown, LockKeyhole, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const whatsappMessage = encodeURIComponent('Salam, saya berminat untuk mendapatkan akses RADAS PRO. Boleh berikan maklumat lanjut?')
const whatsappUrl = `https://wa.me/601126717116?text=${whatsappMessage}`

const freeFeatures = ['Research berstatus Free', 'Fakta asas produk', 'Harga dan anggaran komisen', 'Simpan research untuk rujukan']
const proFeatures = ['Semua Research Free + PRO', 'Verdict dan sebab keputusan', 'Creator competition dan GMV Max', 'Research Insight penuh', 'Content Angles dan hook', 'Video rujukan', 'Execution Playbook']

export function ProPage() {
  const { profile } = useAuth()
  const isPro = profile?.plan === 'pro'

  return (
    <>
      <section className="pro-hero">
        <span className="pro-hero-icon"><Crown /></span>
        <div><span className="eyebrow">RADAS PRO</span><h1>Buat keputusan produk dengan research yang lebih mendalam.</h1><p>Daripada signal produk kepada content dan tindakan—RADAS PRO membantu affiliate memahami sebab sesuatu produk layak diuji, bukan sekadar mengikuti produk yang sedang viral.</p></div>
        {isPro
          ? <Link className="button button-primary" to="/research">Buka Research PRO <ArrowRight /></Link>
          : <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">Mohon Akses PRO <MessageCircle /></a>}
      </section>

      {isPro ? <div className="pro-active-banner"><CheckCircle2 /><div><strong>Pelan RADAS PRO anda aktif.</strong><span>Anda mempunyai akses kepada semua research Free dan PRO.</span></div></div> : null}

      <section className="pro-comparison" aria-label="Perbandingan pelan RADAS">
        <article><span className="plan-label">RADAS Free</span><h2>Mulakan dengan fakta asas.</h2><ul>{freeFeatures.map((feature) => <li key={feature}><CheckCircle2 />{feature}</li>)}</ul></article>
        <article className="featured"><span className="plan-label"><Crown /> RADAS PRO</span><h2>Daripada research kepada tindakan.</h2><ul>{proFeatures.map((feature) => <li key={feature}><CheckCircle2 />{feature}</li>)}</ul></article>
      </section>

      <section className="pro-value-grid">
        <article><ShieldCheck /><h3>Research dilindungi</h3><p>Kandungan premium hanya tersedia kepada akaun PRO yang sah.</p></article>
        <article><Sparkles /><h3>Analisis yang boleh digunakan</h3><p>Fahami peluang, risiko dan sudut content sebelum memulakan ujian.</p></article>
        <article><LockKeyhole /><h3>Tiada janji kosong</h3><p>RADAS membantu keputusan dan pelaksanaan; ia tidak menjamin jualan atau prestasi affiliate.</p></article>
      </section>

      {!isPro ? <section className="pro-final-cta"><Crown /><div><span className="eyebrow">Langkah seterusnya</span><h2>Mohon akses RADAS PRO.</h2><p>Hubungi Admin RADAS melalui WhatsApp untuk mendapatkan maklumat lanjut.</p></div><a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp Admin RADAS <MessageCircle /></a></section> : null}
    </>
  )
}
