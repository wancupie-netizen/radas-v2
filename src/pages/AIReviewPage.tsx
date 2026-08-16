import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { generateResearch, getResearchForReview, saveResearchReview, validateResearchBrief } from '../lib/research-ai'
import { publishResearch } from '../lib/research-publish'
import { useAuth } from '../auth/AuthContext'
import type { AIResearchOutput, ContentAngle, PlaybookStep } from '../lib/research-ai'
import type { ResearchBrief, ResearchBriefFact, ResearchFactStatus, ResearchRow, ResearchVerdict } from '../types/database'
import '../research-brief.css'

const emptyAngle: ContentAngle = { title: '', hook: '', rationale: '' }
const emptyStep: PlaybookStep = { step: '', action: '', notes: '' }
const emptyFact: ResearchBriefFact = { label: '', value: '', status: 'unknown' }
const emptyBrief: ResearchBrief = { summary: '', facts: [], demand: '', content_opportunity: '', risk: '', verification_items: [] }

function toOutput(item: ResearchRow): AIResearchOutput {
  return {
    research_snapshot: item.research_snapshot ?? '',
    research_brief: item.research_brief ?? { ...emptyBrief },
    product_pain: item.product_pain ?? '',
    verdict: item.verdict ?? 'perlu_dipantau',
    verdict_reason: item.verdict_reason ?? '',
    research_insight: item.research_insight ?? '',
    suitable_for: item.suitable_for ?? [],
    content_angles: (item.content_angles ?? []) as unknown as ContentAngle[],
    execution_playbook: (item.execution_playbook ?? []) as unknown as PlaybookStep[],
  }
}

export function AIReviewPage() {
  const { researchId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [research, setResearch] = useState<ResearchRow | null>(null)
  const [output, setOutput] = useState<AIResearchOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!researchId) return
    setLoading(true)
    try { const item = await getResearchForReview(researchId); setResearch(item); setOutput(toOutput(item)) }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Research tidak dapat dimuatkan.' }) }
    finally { setLoading(false) }
  }, [researchId])

  useEffect(() => { void load() }, [load])

  function patch<K extends keyof AIResearchOutput>(key: K, value: AIResearchOutput[K]) {
    setOutput((current) => current ? { ...current, [key]: value } : current)
  }

  function updateAngle(index: number, key: keyof ContentAngle, value: string) {
    if (!output) return
    patch('content_angles', output.content_angles.map((item, position) => position === index ? { ...item, [key]: value } : item))
  }

  function updateStep(index: number, key: keyof PlaybookStep, value: string) {
    if (!output) return
    patch('execution_playbook', output.execution_playbook.map((item, position) => position === index ? { ...item, [key]: value } : item))
  }

  function updateBrief<K extends keyof ResearchBrief>(key: K, value: ResearchBrief[K]) {
    if (!output) return
    patch('research_brief', { ...output.research_brief, [key]: value })
  }

  function updateBriefFact(index: number, key: keyof ResearchBriefFact, value: string) {
    if (!output) return
    updateBrief('facts', output.research_brief.facts.map((fact, position) => position === index ? { ...fact, [key]: value } : fact))
  }

  async function regenerate() {
    if (!researchId) return
    const warning = research?.status === 'published'
      ? 'Jana semula akan menggantikan output AI dan mengeluarkan research ini sementara daripada paparan pengguna sehingga diterbitkan semula. Teruskan?'
      : 'Jana semula akan menggantikan output AI yang sedang dipaparkan. Teruskan?'
    if (!window.confirm(warning)) return
    setGenerating(true); setMessage(null)
    try { await generateResearch(researchId); await load(); setMessage({ type: 'success', text: 'Research berjaya dijana semula.' }) }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI generation gagal.' }) }
    finally { setGenerating(false) }
  }

  async function publish() {
    if (!researchId || !output || !user) return
    const briefError = validateResearchBrief(output.research_brief)
    if (briefError) { setMessage({ type: 'error', text: briefError }); return }
    if (!window.confirm('Terbitkan research ini kepada pengguna RADAS?')) return
    setPublishing(true); setMessage(null)
    try {
      await saveResearchReview(researchId, output)
      const published = await publishResearch(researchId, user.id)
      navigate(`/research/${published.slug}`)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Research tidak dapat diterbitkan.' })
    } finally { setPublishing(false) }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!researchId || !output) return
    setSaving(true); setMessage(null)
    try { await saveResearchReview(researchId, output); setMessage({ type: 'success', text: 'Semakan disimpan. Status ditukar kepada Dalam semakan.' }); setTimeout(() => navigate('/admin'), 900) }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Semakan tidak dapat disimpan.' }) }
    finally { setSaving(false) }
  }

  if (loading) return <main className="review-loading"><LoaderCircle className="spin" /><p>Memuatkan output AI...</p></main>
  if (!research || !output) return <main className="empty-state"><h1>Research tidak ditemui</h1><Link to="/admin">Kembali ke Admin Studio</Link></main>

  return (
    <>
      <Link className="back-link" to="/admin"><ArrowLeft /> Kembali ke Admin Studio</Link>
      <section className="page-heading heading-row"><div><span className="eyebrow">AI Research Review</span><h1>{research.product_name}</h1><p>Semak fakta, nada dan cadangan AI. Semua medan boleh diedit sebelum diteruskan.</p></div><button className="button button-secondary" disabled={generating} onClick={() => void regenerate()}>{generating ? <LoaderCircle className="spin" /> : <Sparkles />}{generating ? 'Menjana...' : 'Jana semula'}</button></section>
      {message ? <div className={`studio-message ${message.type}`} role="status">{message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}<span>{message.text}</span></div> : null}
      <div className="review-facts"><div><span>Platform</span><strong>{research.platform}</strong></div><div><span>Harga</span><strong>RM{Number(research.price).toFixed(2)}</strong></div><div><span>Komisen</span><strong>{research.commission_amount === null ? '-' : `RM${Number(research.commission_amount).toFixed(2)}`}</strong></div><div><span>Status</span><strong>{research.status.replace('_', ' ')}</strong></div></div>
      <form className="review-form" onSubmit={submit}>
        <section className="review-section"><div className="review-section-head"><span>01</span><div><h2>Snapshot dan Verdict</h2><p>Keputusan ringkas yang akan dilihat terlebih dahulu.</p></div></div><div className="review-fields"><label className="field field-wide"><span>Research Snapshot</span><textarea required rows={5} value={output.research_snapshot} onChange={(event) => patch('research_snapshot', event.target.value)} /></label><label className="field field-wide"><span>Product Pain</span><textarea required rows={4} value={output.product_pain} onChange={(event) => patch('product_pain', event.target.value)} placeholder="Masalah utama pengguna yang produk ini cuba selesaikan." /></label><label className="field"><span>Verdict</span><select value={output.verdict} onChange={(event) => patch('verdict', event.target.value as ResearchVerdict)}><option value="layak_diuji">Layak Diuji</option><option value="perlu_dipantau">Perlu Dipantau</option><option value="tidak_disyorkan">Tidak Disyorkan</option></select></label><label className="field"><span>Sesuai untuk (pisahkan dengan koma)</span><input value={output.suitable_for.join(', ')} onChange={(event) => patch('suitable_for', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></label><label className="field field-wide"><span>Sebab Verdict</span><textarea required rows={4} value={output.verdict_reason} onChange={(event) => patch('verdict_reason', event.target.value)} /></label></div></section>
        <section className="review-section"><div className="review-section-head"><span>02</span><div><h2>Research Insight</h2><p>Analisis editorial yang menerangkan peluang dan batas maklumat.</p></div></div><label className="field"><textarea required rows={9} value={output.research_insight} onChange={(event) => patch('research_insight', event.target.value)} /></label></section>
        <section className="review-section"><div className="review-section-head"><span>03</span><div><h2>Paparan Ringkas Pengguna</h2><p>AI menyesuaikan fakta mengikut kategori. Semak semua dakwaan sebelum publish.</p></div></div><div className="brief-review-grid"><div className="review-fields"><label className="field field-wide"><span>Ringkasan produk <small>{output.research_brief.summary.length}/320</small></span><textarea required maxLength={320} rows={4} value={output.research_brief.summary} onChange={(event) => updateBrief('summary', event.target.value)} /></label><div className="brief-facts-editor field-wide"><div className="repeat-title"><strong>Fakta utama (maksimum 4)</strong>{output.research_brief.facts.length < 4 ? <button type="button" onClick={() => updateBrief('facts', [...output.research_brief.facts, { ...emptyFact }])}><Plus /> Tambah</button> : null}</div>{output.research_brief.facts.map((fact, index) => <div className="brief-fact-row" key={index}><input aria-label={`Label fakta ${index + 1}`} required placeholder="Contoh: Harga" value={fact.label} onChange={(event) => updateBriefFact(index, 'label', event.target.value)} /><input aria-label={`Nilai fakta ${index + 1}`} required placeholder="Contoh: RM150" value={fact.value} onChange={(event) => updateBriefFact(index, 'value', event.target.value)} /><select aria-label={`Status fakta ${index + 1}`} value={fact.status} onChange={(event) => updateBriefFact(index, 'status', event.target.value as ResearchFactStatus)}><option value="verified">Disahkan daripada input</option><option value="seller_claim">Dakwaan penjual</option><option value="unknown">Belum diketahui</option></select><button type="button" aria-label={`Buang fakta ${index + 1}`} onClick={() => updateBrief('facts', output.research_brief.facts.filter((_, position) => position !== index))}><Trash2 /></button></div>)}</div><label className="field field-wide"><span>Permintaan asas <small>{output.research_brief.demand.length}/120</small></span><textarea required maxLength={120} rows={2} value={output.research_brief.demand} onChange={(event) => updateBrief('demand', event.target.value)} /></label><label className="field field-wide"><span>Daya tarikan content <small>{output.research_brief.content_opportunity.length}/140</small></span><textarea required maxLength={140} rows={2} value={output.research_brief.content_opportunity} onChange={(event) => updateBrief('content_opportunity', event.target.value)} /></label><label className="field field-wide"><span>Risiko utama <small>{output.research_brief.risk.length}/160</small></span><textarea required maxLength={160} rows={2} value={output.research_brief.risk} onChange={(event) => updateBrief('risk', event.target.value)} /></label><label className="field field-wide"><span>Perlu disahkan (pisahkan dengan koma, maksimum 6)</span><input value={output.research_brief.verification_items.join(', ')} onChange={(event) => updateBrief('verification_items', event.target.value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 6))} /></label></div><aside className="brief-admin-preview"><span className="eyebrow">Preview pengguna</span><h3>Ringkasan produk</h3><p>{output.research_brief.summary || 'Ringkasan pendek akan dipaparkan di sini.'}</p><div className="brief-preview-facts">{output.research_brief.facts.map((fact, index) => <div key={index}><small>{fact.label || 'Fakta'}</small><strong>{fact.value || 'Belum diketahui'}</strong><span className={`fact-status ${fact.status}`}>{fact.status === 'verified' ? 'Input' : fact.status === 'seller_claim' ? 'Dakwaan penjual' : 'Perlu disahkan'}</span></div>)}</div></aside></div></section>
        <section className="review-section"><div className="review-section-head"><span>04</span><div><h2>Content Angles</h2><p>Cadangan sudut content untuk affiliate menguji produk.</p></div><button className="button button-secondary" type="button" onClick={() => patch('content_angles', [...output.content_angles, { ...emptyAngle }])}><Plus /> Tambah</button></div><div className="repeat-list">{output.content_angles.map((angle, index) => <article key={`${index}-${angle.title}`}><div className="repeat-title"><strong>Angle {index + 1}</strong><button type="button" onClick={() => patch('content_angles', output.content_angles.filter((_, position) => position !== index))}><Trash2 /></button></div><label className="field"><span>Tajuk</span><input required value={angle.title} onChange={(event) => updateAngle(index, 'title', event.target.value)} /></label><label className="field"><span>Hook</span><textarea required rows={3} value={angle.hook} onChange={(event) => updateAngle(index, 'hook', event.target.value)} /></label><label className="field"><span>Rasional</span><textarea required rows={3} value={angle.rationale} onChange={(event) => updateAngle(index, 'rationale', event.target.value)} /></label></article>)}</div></section>
        <section className="review-section"><div className="review-section-head"><span>05</span><div><h2>Execution Playbook</h2><p>Urutan tindakan yang jelas selepas research dipilih.</p></div><button className="button button-secondary" type="button" onClick={() => patch('execution_playbook', [...output.execution_playbook, { ...emptyStep }])}><Plus /> Tambah</button></div><div className="repeat-list">{output.execution_playbook.map((step, index) => <article key={`${index}-${step.step}`}><div className="repeat-title"><strong>Langkah {index + 1}</strong><button type="button" onClick={() => patch('execution_playbook', output.execution_playbook.filter((_, position) => position !== index))}><Trash2 /></button></div><label className="field"><span>Nama langkah</span><input required value={step.step} onChange={(event) => updateStep(index, 'step', event.target.value)} /></label><label className="field"><span>Tindakan</span><textarea required rows={3} value={step.action} onChange={(event) => updateStep(index, 'action', event.target.value)} /></label><label className="field"><span>Nota</span><textarea required rows={3} value={step.notes} onChange={(event) => updateStep(index, 'notes', event.target.value)} /></label></article>)}</div></section>
        <div className="review-actions"><span>AI tidak menerbitkan research secara automatik.</span><div><button className="button button-secondary" disabled={saving || publishing} type="submit">{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? 'Menyimpan...' : 'Simpan semakan'}</button><button className="button button-primary" disabled={saving || publishing} type="button" onClick={() => void publish()}>{publishing ? <LoaderCircle className="spin" /> : <CheckCircle2 />}{publishing ? 'Menerbitkan...' : 'Simpan & Publish'}</button></div></div>
      </form>
    </>
  )
}
