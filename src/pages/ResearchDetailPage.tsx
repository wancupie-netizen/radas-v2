import { AlertTriangle, ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, CheckCircle2, ExternalLink, Lightbulb, LoaderCircle, Megaphone, Play, PlayCircle, SearchCheck, ShieldCheck, Sparkles, Target, Users, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getPublishedResearchBySlug } from '../lib/database'
import { getProductImageUrl } from '../lib/research-admin'
import type { ContentAngle, PlaybookStep } from '../lib/research-ai'
import { isResearchSaved, removeSavedResearch, saveResearch } from '../lib/watchlist'
import type { GmvMaxStatus, ResearchRow } from '../types/database'
import '../research-brief.css'

const verdictLabels = { layak_diuji: 'Layak Diuji', perlu_dipantau: 'Perlu Dipantau', tidak_disyorkan: 'Tidak Disyorkan' }
const integrityLabels = { reviewed: 'Disemak RADAS', limited_information: 'Maklumat Terhad', update_required: 'Perlu Dikemas Kini' }
const gmvMaxBadges: Partial<Record<GmvMaxStatus, { label: string; tone: string }>> = {
  confirmed_active: { label: 'GMV Max Aktif', tone: 'confirmed' },
  indicated: { label: 'Petunjuk GMV Max', tone: 'indicated' },
  inactive: { label: 'GMV Max Tidak Aktif', tone: 'inactive' },
}

function getVideoEmbed(url: string) {
  try {
    const parsed = new URL(url)
    const tiktokId = parsed.pathname.match(/\/video\/(\d+)/)?.[1]
    if ((parsed.hostname === 'tiktok.com' || parsed.hostname.endsWith('.tiktok.com')) && tiktokId) return { platform: 'TikTok', src: `https://www.tiktok.com/player/v1/${tiktokId}`, portrait: true }
    const youtubeId = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1).split('/')[0] : parsed.hostname.endsWith('youtube.com') ? parsed.searchParams.get('v') ?? parsed.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1] : null
    if (youtubeId && /^[a-zA-Z0-9_-]{6,20}$/.test(youtubeId)) return { platform: 'YouTube', src: `https://www.youtube.com/embed/${youtubeId}`, portrait: parsed.pathname.includes('/shorts/') }
    return { platform: parsed.hostname.replace(/^www\./, ''), src: null, portrait: false }
  } catch { return { platform: 'Video', src: null, portrait: false } }
}

export function ResearchDetailPage() {
  const { researchId } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState<ResearchRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [savingWatchlist, setSavingWatchlist] = useState(false)
  const [watchlistError, setWatchlistError] = useState<string | null>(null)
  const [activeVideo, setActiveVideo] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getPublishedResearchBySlug(researchId ?? '').then((value) => { if (active) setItem(value) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [researchId])

  useEffect(() => {
    if (!user || !item) return
    let active = true
    setSavingWatchlist(true)
    isResearchSaved(user.id, item.id).then((value) => { if (active) setSaved(value) }).catch((error) => { if (active) setWatchlistError(error instanceof Error ? error.message : 'Watchlist tidak dapat dimuatkan.') }).finally(() => { if (active) setSavingWatchlist(false) })
    return () => { active = false }
  }, [user, item])

  async function toggleWatchlist() {
    if (!user || !item) return
    setSavingWatchlist(true); setWatchlistError(null)
    try {
      if (saved) await removeSavedResearch(user.id, item.id)
      else await saveResearch(user.id, item.id)
      setSaved((current) => !current)
    } catch (error) {
      setWatchlistError(error instanceof Error ? error.message : 'Watchlist tidak dapat dikemas kini.')
    } finally { setSavingWatchlist(false) }
  }

  if (loading) return <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan research...</p></div>
  if (!item) return <section className="empty-state"><h1>Research tidak ditemui</h1><p>Research mungkin belum diterbitkan atau tidak tersedia untuk pelan anda.</p><Link to="/research">Kembali ke library</Link></section>

  const imageUrl = getProductImageUrl(item.product_image_path)
  const angles = item.content_angles as unknown as ContentAngle[]
  const playbook = item.execution_playbook as unknown as PlaybookStep[]
  const verifiedDate = item.last_verified_at ? new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium' }).format(new Date(item.last_verified_at)) : '-'
  const creatorLabel = item.creator_count === null ? 'Belum direkod' : `${Number(item.creator_count).toLocaleString('ms-MY')} creator`
  const gmvMaxBadge = gmvMaxBadges[item.gmv_max_status]

  return (
    <>
      <Link className="back-link" to="/research"><ArrowLeft /> Kembali ke Research Library</Link>
      <section className="live-detail-hero"><div className="live-detail-image">{imageUrl ? <img src={imageUrl} alt={item.product_name} /> : <span>{item.product_name.slice(0, 2).toUpperCase()}</span>}</div><div><span className="eyebrow">{item.category} &middot; {item.platform}</span><h1>{item.product_name}</h1><p>{item.research_brief?.summary ?? item.research_snapshot}</p><div className="detail-badges"><span className={`verdict ${item.verdict === 'layak_diuji' ? 'positive' : item.verdict === 'perlu_dipantau' ? 'watch' : 'negative'}`}>{item.verdict ? verdictLabels[item.verdict] : 'Belum dinilai'}</span>{gmvMaxBadge ? <span className={`gmv-max-badge ${gmvMaxBadge.tone}`} title="Seller Support Signal — bukan jaminan prestasi affiliate"><Megaphone aria-hidden="true" />{gmvMaxBadge.label}</span> : null}<span>{item.access_level.toUpperCase()}</span></div></div><div className="detail-actions"><a className="button button-primary" href={item.product_url} target="_blank" rel="noreferrer">Lihat produk <ArrowUpRight /></a><button className={`button watchlist-button ${saved ? 'saved' : ''}`} disabled={savingWatchlist} onClick={() => void toggleWatchlist()} aria-pressed={saved}>{savingWatchlist ? <LoaderCircle className="spin" /> : saved ? <BookmarkCheck /> : <Bookmark />}{saved ? 'Tersimpan' : 'Simpan research'}</button>{watchlistError ? <small>{watchlistError}</small> : null}</div></section>
      <section className="detail-stats"><div><span>Harga</span><strong>RM{Number(item.price).toFixed(2)}</strong></div><div><span>Anggaran komisen</span><strong>{item.commission_amount === null ? '-' : `RM${Number(item.commission_amount).toFixed(2)}`}</strong></div><div><span>Jumlah creator</span><strong><Users /> {creatorLabel}</strong></div><div><span>Platform</span><strong>{item.platform}</strong></div></section>
      <div className="published-layout">
        <main className="published-main">
          <article className="content-panel"><span className="panel-icon"><Target /></span><div><span className="eyebrow">RADAS Verdict</span><h2>{item.verdict ? verdictLabels[item.verdict] : 'Belum dinilai'}</h2><p>{item.verdict_reason}</p></div></article>
          {item.research_brief ? <section className="research-brief"><div className="research-brief-heading"><span className="eyebrow">Research dalam 60 saat</span><h2>Fakta penting sebelum anda memilih</h2><p>{item.research_brief.summary}</p></div><div className="research-brief-facts">{item.research_brief.facts.map((fact, index) => <article key={`${fact.label}-${index}`}><small>{fact.label}</small><strong>{fact.value}</strong><span className={`fact-status ${fact.status}`}>{fact.status === 'verified' ? 'Daripada input' : fact.status === 'seller_claim' ? 'Dakwaan penjual' : 'Perlu disahkan'}</span></article>)}</div><div className="research-brief-reasons"><article><SearchCheck /><div><span>Permintaan asas</span><p>{item.research_brief.demand}</p></div></article><article><Sparkles /><div><span>Daya tarikan content</span><p>{item.research_brief.content_opportunity}</p></div></article><article><AlertTriangle /><div><span>Risiko utama</span><p>{item.research_brief.risk}</p></div></article></div>{item.research_brief.verification_items.length > 0 ? <div className="research-verification"><strong>Perlu disahkan</strong><div>{item.research_brief.verification_items.map((value) => <span key={value}>{value}</span>)}</div></div> : null}<details className="full-analysis"><summary>Baca analisis penuh</summary><div><h3>Kenapa produk ini perlu diperhatikan</h3><p>{item.research_insight}</p></div></details></section> : <article className="content-panel"><span className="panel-icon blue"><Lightbulb /></span><div><span className="eyebrow">Research Insight</span><h2>Kenapa produk ini perlu diperhatikan</h2><p>{item.research_insight}</p></div></article>}
          {item.reference_videos.length > 0 ? <section className="reference-video-section"><div className="playbook-heading"><span className="eyebrow">Video Rujukan</span><h2>Contoh content untuk dikaji</h2><p>Gunakan video ini untuk memahami hook, visual dan gaya penyampaian.</p></div><div className="reference-video-grid">{item.reference_videos.map((video, index) => { const embed = getVideoEmbed(video.url); const checkedDate = video.checked_at ? new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium' }).format(new Date(`${video.checked_at}T00:00:00`)) : 'Belum direkod'; return <article className={`reference-video-card ${embed.portrait ? 'portrait' : ''}`} key={`${video.url}-${index}`}><div className="reference-video-player">{activeVideo === index && embed.src ? <iframe allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={embed.src} title={`Video rujukan ${index + 1}`} /> : <button type="button" onClick={() => embed.src ? setActiveVideo(index) : window.open(video.url, '_blank', 'noopener,noreferrer')}><span><Play /></span><strong>{embed.src ? 'Tonton video' : 'Buka video'}</strong></button>}</div><div className="reference-video-meta"><span><Video /> {embed.platform}</span><small>Disemak {checkedDate}</small><a href={video.url} target="_blank" rel="noreferrer">Buka sumber <ExternalLink /></a></div></article> })}</div></section> : null}
          <section className="affiliate-playbook"><div className="playbook-heading"><span className="eyebrow">Affiliate Playbook</span><h2>Daripada research kepada tindakan</h2><p>Panduan praktikal yang telah disemak oleh RADAS.</p></div><article className="playbook-feature"><Target /><div><span>Product Pain</span><p>{item.product_pain}</p></div></article><article className="playbook-feature"><CheckCircle2 /><div><span>Suitable For</span><div className="tag-list">{item.suitable_for.map((value) => <span key={value}>{value}</span>)}</div></div></article><div className="published-angle-grid">{angles.map((angle, index) => <article key={`${angle.title}-${index}`}><span>Content Angle {index + 1}</span><h3>{angle.title}</h3><strong>{angle.hook}</strong><p>{angle.rationale}</p></article>)}</div><div className="published-steps"><h3><PlayCircle /> Execution Playbook</h3>{playbook.map((step, index) => <article key={`${step.step}-${index}`}><b>{String(index + 1).padStart(2, '0')}</b><div><h4>{step.step}</h4><p>{step.action}</p><small>{step.notes}</small></div></article>)}</div></section>
        </main>
        <aside className="integrity-panel"><ShieldCheck /><span className="eyebrow">Research Integrity</span><h3>{integrityLabels[item.integrity_status]}</h3><dl><div><dt>Last verified</dt><dd>{verifiedDate}</dd></div><div><dt>Verified by</dt><dd>RADAS Editorial</dd></div><div><dt>Access</dt><dd>{item.access_level.toUpperCase()}</dd></div></dl><p>Harga, komisen dan jumlah creator boleh berubah. Semak platform sebelum menghasilkan content.</p></aside>
      </div>
      <nav className="detail-bottom-navigation" aria-label="Navigasi selepas research"><Link className="button button-secondary" to="/research"><ArrowLeft /> Kembali ke Research Library</Link></nav>
    </>
  )
}
