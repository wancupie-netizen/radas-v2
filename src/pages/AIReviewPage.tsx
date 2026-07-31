import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { generateResearch, getResearchForReview, saveResearchReview } from '../lib/research-ai'
import type { AIResearchOutput, ContentAngle, PlaybookStep } from '../lib/research-ai'
import type { ResearchRow, ResearchVerdict } from '../types/database'

const emptyAngle: ContentAngle = { title: '', hook: '', rationale: '' }
const emptyStep: PlaybookStep = { step: '', action: '', notes: '' }

function toOutput(item: ResearchRow): AIResearchOutput {
  return {
    research_snapshot: item.research_snapshot ?? '',
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
  const navigate = useNavigate()
  const [research, setResearch] = useState<ResearchRow | null>(null)
  const [output, setOutput] = useState<AIResearchOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
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

  async function regenerate() {
    if (!researchId) return
    if (!window.confirm('Jana semula akan menggantikan output AI yang sedang dipaparkan. Teruskan?')) return
    setGenerating(true); setMessage(null)
    try { await generateResearch(researchId); await load(); setMessage({ type: 'success', text: 'Research berjaya dijana semula.' }) }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI generation gagal.' }) }
    finally { setGenerating(false) }
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
        <section className="review-section"><div className="review-section-head"><span>01</span><div><h2>Snapshot dan Verdict</h2><p>Keputusan ringkas yang akan dilihat terlebih dahulu.</p></div></div><div className="review-fields"><label className="field field-wide"><span>Research Snapshot</span><textarea required rows={5} value={output.research_snapshot} onChange={(event) => patch('research_snapshot', event.target.value)} /></label><label className="field"><span>Verdict</span><select value={output.verdict} onChange={(event) => patch('verdict', event.target.value as ResearchVerdict)}><option value="layak_diuji">Layak Diuji</option><option value="perlu_dipantau">Perlu Dipantau</option><option value="tidak_disyorkan">Tidak Disyorkan</option></select></label><label className="field"><span>Sesuai untuk (pisahkan dengan koma)</span><input value={output.suitable_for.join(', ')} onChange={(event) => patch('suitable_for', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></label><label className="field field-wide"><span>Sebab Verdict</span><textarea required rows={4} value={output.verdict_reason} onChange={(event) => patch('verdict_reason', event.target.value)} /></label></div></section>
        <section className="review-section"><div className="review-section-head"><span>02</span><div><h2>Research Insight</h2><p>Analisis editorial yang menerangkan peluang dan batas maklumat.</p></div></div><label className="field"><textarea required rows={9} value={output.research_insight} onChange={(event) => patch('research_insight', event.target.value)} /></label></section>
        <section className="review-section"><div className="review-section-head"><span>03</span><div><h2>Content Angles</h2><p>Cadangan sudut content untuk affiliate menguji produk.</p></div><button className="button button-secondary" type="button" onClick={() => patch('content_angles', [...output.content_angles, { ...emptyAngle }])}><Plus /> Tambah</button></div><div className="repeat-list">{output.content_angles.map((angle, index) => <article key={`${index}-${angle.title}`}><div className="repeat-title"><strong>Angle {index + 1}</strong><button type="button" onClick={() => patch('content_angles', output.content_angles.filter((_, position) => position !== index))}><Trash2 /></button></div><label className="field"><span>Tajuk</span><input required value={angle.title} onChange={(event) => updateAngle(index, 'title', event.target.value)} /></label><label className="field"><span>Hook</span><textarea required rows={3} value={angle.hook} onChange={(event) => updateAngle(index, 'hook', event.target.value)} /></label><label className="field"><span>Rasional</span><textarea required rows={3} value={angle.rationale} onChange={(event) => updateAngle(index, 'rationale', event.target.value)} /></label></article>)}</div></section>
        <section className="review-section"><div className="review-section-head"><span>04</span><div><h2>Execution Playbook</h2><p>Urutan tindakan yang jelas selepas research dipilih.</p></div><button className="button button-secondary" type="button" onClick={() => patch('execution_playbook', [...output.execution_playbook, { ...emptyStep }])}><Plus /> Tambah</button></div><div className="repeat-list">{output.execution_playbook.map((step, index) => <article key={`${index}-${step.step}`}><div className="repeat-title"><strong>Langkah {index + 1}</strong><button type="button" onClick={() => patch('execution_playbook', output.execution_playbook.filter((_, position) => position !== index))}><Trash2 /></button></div><label className="field"><span>Nama langkah</span><input required value={step.step} onChange={(event) => updateStep(index, 'step', event.target.value)} /></label><label className="field"><span>Tindakan</span><textarea required rows={3} value={step.action} onChange={(event) => updateStep(index, 'action', event.target.value)} /></label><label className="field"><span>Nota</span><textarea required rows={3} value={step.notes} onChange={(event) => updateStep(index, 'notes', event.target.value)} /></label></article>)}</div></section>
        <div className="review-actions"><span>AI tidak menerbitkan research secara automatik.</span><button className="button button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? 'Menyimpan...' : 'Simpan semakan'}</button></div>
      </form>
    </>
  )
}