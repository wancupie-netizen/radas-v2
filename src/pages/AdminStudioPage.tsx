import { AlertCircle, Archive, BrainCircuit, CalendarDays, CheckCircle2, Edit3, Eye, ImagePlus, Link2, LoaderCircle, Plus, Save, Sparkles, Trash2, Video, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { generateResearch } from '../lib/research-ai'
import { archiveResearch } from '../lib/research-publish'
import { createResearchDraft, deleteResearchDraft, getProductImageUrl, listAdminResearch, removeProductImage, updateResearchDraft, uploadProductImage } from '../lib/research-admin'
import type { ReferenceVideo, ResearchAccess, ResearchRow } from '../types/database'

interface DraftForm {
  productName: string
  category: string
  platform: string
  price: string
  commission: string
  creatorCount: string
  productUrl: string
  officialDescription: string
  referenceVideos: ReferenceVideo[]
  accessLevel: ResearchAccess
}

const emptyReferenceVideo = (): ReferenceVideo => ({ url: '', checked_at: new Date().toISOString().slice(0, 10) })
const emptyForm = (): DraftForm => ({ productName: '', category: '', platform: '', price: '', commission: '', creatorCount: '', productUrl: '', officialDescription: '', referenceVideos: [emptyReferenceVideo()], accessLevel: 'free' })
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const draftStorageKey = 'radas:admin-research-form:v1'
const editStorageKeyPrefix = 'radas:admin-research-edit:v2:' // RADAS PC-008A2
const activeEditStorageKey = 'radas:admin-research-active-edit:v2'

function readSavedDraft(): DraftForm {
  try {
    const saved = window.localStorage.getItem(draftStorageKey)
    if (!saved) return emptyForm()
    const parsed = JSON.parse(saved) as Partial<DraftForm>
    return {
      productName: typeof parsed.productName === 'string' ? parsed.productName : '',
      category: typeof parsed.category === 'string' ? parsed.category : '',
      platform: typeof parsed.platform === 'string' ? parsed.platform : '',
      price: typeof parsed.price === 'string' ? parsed.price : '',
      commission: typeof parsed.commission === 'string' ? parsed.commission : '',
      creatorCount: typeof parsed.creatorCount === 'string' ? parsed.creatorCount : '',
      productUrl: typeof parsed.productUrl === 'string' ? parsed.productUrl : '',
      officialDescription: typeof parsed.officialDescription === 'string' ? parsed.officialDescription : '',
      referenceVideos: Array.isArray(parsed.referenceVideos)
        ? parsed.referenceVideos.slice(0, 3).map((video) => ({ url: typeof video.url === 'string' ? video.url : '', checked_at: typeof video.checked_at === 'string' ? video.checked_at : '' }))
        : [emptyReferenceVideo()],
      accessLevel: parsed.accessLevel === 'pro' ? 'pro' : 'free',
    }
  } catch {
    return emptyForm()
  }
}

function formatMoney(value: number | null) {
  return value === null ? '-' : new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(value)
}

function readableStatus(status: ResearchRow['status']) {
  return ({ draft: 'Draf', ai_generated: 'Dijana AI', in_review: 'Dalam semakan', published: 'Diterbitkan', archived: 'Diarkibkan' })[status]
}

export function AdminStudioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<DraftForm>(readSavedDraft)
  const [research, setResearch] = useState<ResearchRow[]>([])
  const [editing, setEditing] = useState<ResearchRow | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadResearch = useCallback(async () => {
    setLoading(true)
    try { setResearch(await listAdminResearch()) }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Research tidak dapat dimuatkan.' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadResearch() }, [loadResearch])
  useEffect(() => {
    const key = editing ? `${editStorageKeyPrefix}${editing.id}` : draftStorageKey
    window.localStorage.setItem(key, JSON.stringify(form))
  }, [editing, form])
  useEffect(() => {
    const activeId = window.localStorage.getItem(activeEditStorageKey)
    if (!activeId || editing) return
    const activeItem = research.find((item) => item.id === activeId)
    if (activeItem) startEdit(activeItem)
  }, [research])
  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const draftCount = useMemo(() => research.filter((item) => item.status === 'draft').length, [research])

  function updateField<K extends keyof DraftForm>(key: K, value: DraftForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateReferenceVideo(index: number, key: keyof ReferenceVideo, value: string) {
    updateField('referenceVideos', form.referenceVideos.map((video, position) => position === index ? { ...video, [key]: value } : video))
  }

  function resetForm() {
    if (editing) window.localStorage.removeItem(`${editStorageKeyPrefix}${editing.id}`)
    else window.localStorage.removeItem(draftStorageKey)
    window.localStorage.removeItem(activeEditStorageKey)
    setForm(emptyForm()); setEditing(null); setImageFile(null); setPreviewUrl(null); setMessage(null)
  }

  function startEdit(item: ResearchRow) {
    const databaseForm: DraftForm = { productName: item.product_name, category: item.category, platform: item.platform, price: String(item.price), commission: item.commission_amount === null ? '' : String(item.commission_amount), creatorCount: item.creator_count === null ? '' : String(item.creator_count), productUrl: item.product_url, officialDescription: item.official_description, referenceVideos: item.reference_videos.length > 0 ? item.reference_videos.slice(0, 3) : [emptyReferenceVideo()], accessLevel: item.access_level }
    let nextForm = databaseForm
    try {
      const saved = window.localStorage.getItem(`${editStorageKeyPrefix}${item.id}`)
      if (saved) nextForm = { ...databaseForm, ...(JSON.parse(saved) as Partial<DraftForm>) }
    } catch { window.localStorage.removeItem(`${editStorageKeyPrefix}${item.id}`) }
    window.localStorage.setItem(activeEditStorageKey, item.id)
    setEditing(item); setForm(nextForm)
    setImageFile(null); setPreviewUrl(getProductImageUrl(item.product_image_path)); setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!allowedImageTypes.has(file.type)) { setMessage({ type: 'error', text: 'Gunakan imej JPEG, PNG atau WebP.' }); event.target.value = ''; return }
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: 'error', text: 'Saiz imej tidak boleh melebihi 5 MB.' }); event.target.value = ''; return }
    setImageFile(file); setMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setSaving(true); setMessage(null)
    let uploadedPath: string | null = null
    try {
      if (imageFile) uploadedPath = await uploadProductImage(imageFile, user.id)
      const input = { productName: form.productName, category: form.category, platform: form.platform, price: Number(form.price), commissionAmount: form.commission ? Number(form.commission) : null, creatorCount: form.creatorCount ? Number(form.creatorCount) : null, productUrl: form.productUrl, officialDescription: form.officialDescription, referenceVideos: form.referenceVideos.filter((video) => video.url.trim()).map((video) => ({ url: video.url.trim(), checked_at: video.checked_at })), accessLevel: form.accessLevel }
      if (editing) {
        const oldPath = editing.product_image_path
        await updateResearchDraft(editing.id, input, uploadedPath ?? oldPath)
        window.localStorage.removeItem(`${editStorageKeyPrefix}${editing.id}`)
        window.localStorage.removeItem(activeEditStorageKey)
        if (uploadedPath && oldPath) await removeProductImage(oldPath)
        setMessage({ type: 'success', text: 'Draf research berjaya dikemas kini.' })
      } else {
        await createResearchDraft(input, user.id, uploadedPath)
        setMessage({ type: 'success', text: 'Draf research berjaya disimpan.' })
      }
      setForm(emptyForm()); setEditing(null); setImageFile(null); setPreviewUrl(null); window.localStorage.removeItem(draftStorageKey)
      await loadResearch()
    } catch (error) {
      if (uploadedPath) await removeProductImage(uploadedPath).catch(() => undefined)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Draf tidak dapat disimpan.' })
    } finally { setSaving(false) }
  }

  async function handleGenerate(item: ResearchRow) {
    setGeneratingId(item.id); setMessage(null)
    try {
      await generateResearch(item.id)
      await loadResearch()
      navigate(`/admin/research/${item.id}/review`)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI generation gagal.' })
    } finally { setGeneratingId(null) }
  }

  // RADAS PC-007: published research is archived, never regenerated or deleted directly.
  async function handleArchive(item: ResearchRow) {
    if (!window.confirm(`Arkibkan "${item.product_name}"? Research ini akan dikeluarkan daripada Research Library.`)) return
    try {
      await archiveResearch(item.id)
      setMessage({ type: 'success', text: 'Research telah diarkibkan.' })
      await loadResearch()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Research tidak dapat diarkibkan.' })
    }
  }

  async function handleDelete(item: ResearchRow) {
    if (!window.confirm(`Padam draf "${item.product_name}"? Tindakan ini tidak boleh dibatalkan.`)) return
    try { await deleteResearchDraft(item); if (editing?.id === item.id) resetForm(); setMessage({ type: 'success', text: 'Draf research telah dipadam.' }); await loadResearch() }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Draf tidak dapat dipadam.' }) }
  }

  return (
    <>
      <section className="page-heading heading-row"><div><span className="eyebrow">Admin workflow</span><h1>Research Studio</h1><p>Masukkan fakta asas produk, simpan draf dan pastikan semua maklumat tepat sebelum AI digunakan.</p></div><div className="studio-summary"><strong>{draftCount}</strong><span>Draf aktif</span></div></section>
      {message ? <div className={`studio-message ${message.type}`} role="status">{message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}<span>{message.text}</span><button onClick={() => setMessage(null)} aria-label="Tutup mesej"><X /></button></div> : null}
      <div className="studio-layout crud-layout">
        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading"><div><span>{editing ? 'Edit research' : 'Research baharu'}</span><h2>{editing ? editing.product_name : 'Maklumat produk'}</h2></div><span className="status-dot">{editing ? 'Sedang diedit' : 'Draf baharu'}</span></div>
          <div className="form-grid">
            <label className="field field-wide"><span>Nama produk</span><input required value={form.productName} onChange={(event) => updateField('productName', event.target.value)} placeholder="Contoh: Portable Blender Pro" /></label>
            <label className="field"><span>Kategori</span><select required value={form.category} onChange={(event) => updateField('category', event.target.value)}><option value="" disabled>Pilih kategori</option><option>Home & Living</option><option>Health & Wellness</option><option>Beauty</option><option>Food & Beverage</option><option>Automotive</option><option>Fashion</option><option>Electronics</option><option>Lain-lain</option></select></label>
            <label className="field"><span>Platform</span><select required value={form.platform} onChange={(event) => updateField('platform', event.target.value)}><option value="" disabled>Pilih platform</option><option>Shopee Affiliate</option><option>TikTok Shop</option><option>Involve Asia</option><option>Accesstrade</option><option>ClickAsia</option><option>Website Owner</option><option>Lain-lain</option></select></label>
            <label className="field"><span>Harga</span><div className="input-prefix"><b>RM</b><input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => updateField('price', event.target.value)} placeholder="0.00" /></div></label>
            <label className="field"><span>Anggaran komisen</span><div className="input-prefix"><b>RM</b><input min="0" step="0.01" type="number" value={form.commission} onChange={(event) => updateField('commission', event.target.value)} placeholder="0.00" /></div></label>
            <label className="field"><span>Jumlah creator (anggaran)</span><input min="0" step="1" type="number" value={form.creatorCount} onChange={(event) => updateField('creatorCount', event.target.value)} placeholder="Contoh: 4100" /><small>Kemas kini berdasarkan semakan platform.</small></label>
            <label className="field field-wide"><span>Pautan produk</span><div className="input-icon"><Link2 /><input required type="url" value={form.productUrl} onChange={(event) => updateField('productUrl', event.target.value)} placeholder="https://..." /></div></label>
            <label className="field field-wide"><span>Deskripsi rasmi</span><textarea required rows={7} value={form.officialDescription} onChange={(event) => updateField('officialDescription', event.target.value)} placeholder="Tampal deskripsi rasmi daripada penjual atau platform..." /><small>Gunakan fakta daripada halaman rasmi produk.</small></label>
            <div className="field field-wide video-reference-field"><div className="video-reference-head"><div><span>Video rujukan</span><small>Tambah sehingga 3 pautan TikTok, YouTube atau platform lain.</small></div>{form.referenceVideos.length < 3 ? <button className="button button-secondary" type="button" onClick={() => updateField('referenceVideos', [...form.referenceVideos, emptyReferenceVideo()])}><Plus /> Tambah video</button> : null}</div><div className="video-reference-list">{form.referenceVideos.map((video, index) => <div className="video-reference-row" key={index}><label><span>Link video {index + 1}</span><div className="input-icon"><Video /><input type="url" value={video.url} onChange={(event) => updateReferenceVideo(index, 'url', event.target.value)} placeholder="https://www.tiktok.com/@creator/video/..." /></div></label><label><span>Tarikh semakan</span><div className="input-icon"><CalendarDays /><input required={Boolean(video.url)} type="date" value={video.checked_at} onChange={(event) => updateReferenceVideo(index, 'checked_at', event.target.value)} /></div></label>{form.referenceVideos.length > 1 ? <button className="icon-button danger" type="button" onClick={() => updateField('referenceVideos', form.referenceVideos.filter((_, position) => position !== index))} aria-label={`Buang video ${index + 1}`}><Trash2 /></button> : null}</div>)}</div></div>
            <label className="field"><span>Akses research</span><select value={form.accessLevel} onChange={(event) => updateField('accessLevel', event.target.value as ResearchAccess)}><option value="free">Free</option><option value="pro">Pro</option></select></label>
            <label className="field"><span>Imej produk</span><span className="file-input"><ImagePlus />{imageFile ? imageFile.name : editing?.product_image_path ? 'Tukar imej' : 'Pilih imej'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /></span><small>JPEG, PNG atau WebP. Maksimum 5 MB.</small></label>
          </div>
          {previewUrl ? <div className="image-preview"><img src={previewUrl} alt="Preview produk" /><button type="button" onClick={() => { setImageFile(null); setPreviewUrl(editing ? getProductImageUrl(editing.product_image_path) : null) }}><X /> Buang pilihan</button></div> : null}
          <div className="form-actions">{editing ? <button className="button button-ghost" type="button" onClick={resetForm}><X /> Batal edit</button> : null}<button className="button button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? 'Menyimpan...' : editing ? 'Simpan perubahan' : 'Simpan draf'}</button></div>
        </form>
        <aside className="draft-panel">
          <div className="draft-panel-head"><div><span className="eyebrow">Editorial queue</span><h2>Research tersimpan</h2></div><button className="icon-button" onClick={resetForm} title="Research baharu"><Plus /></button></div>
          <div className="workflow-track" aria-label="Aliran status research"><span>Draf</span><i aria-hidden="true">{'\u2192'}</i><span>AI Generated</span><i aria-hidden="true">{'\u2192'}</i><span>Dalam Semakan</span><i aria-hidden="true">{'\u2192'}</i><span>Diterbitkan</span></div>
          {loading ? <div className="draft-empty"><LoaderCircle className="spin" /><p>Memuatkan research...</p></div> : research.length === 0 ? <div className="draft-empty"><Sparkles /><h3>Belum ada draf</h3><p>Research pertama yang disimpan akan muncul di sini.</p></div> : <div className="draft-list">{research.map((item) => <article className="draft-item" key={item.id}>{item.product_image_path ? <img src={getProductImageUrl(item.product_image_path) ?? ''} alt="" /> : <span className="draft-placeholder">{item.product_name.slice(0, 2).toUpperCase()}</span>}<div className="draft-copy"><div><span className={`draft-status ${item.status}`}>{readableStatus(item.status)}</span><span>{item.access_level.toUpperCase()}</span></div><h3>{item.product_name}</h3><p>{item.platform} / {formatMoney(item.price)}</p></div><div className="draft-actions workflow-actions">
  {item.status === 'draft' ? <button className="queue-action ai-action" disabled={generatingId !== null} onClick={() => void handleGenerate(item)} title="Hasilkan research menggunakan AI">{generatingId === item.id ? <LoaderCircle className="spin" /> : <BrainCircuit />}<span>{generatingId === item.id ? 'Menjana...' : 'Jana dengan AI'}</span></button> : null}
  {(item.status === 'ai_generated' || item.status === 'in_review') ? <button className="queue-action review-action" onClick={() => navigate(`/admin/research/${item.id}/review`)} title="Buka hasil AI sedia ada"><Eye /><span>Buka hasil</span></button> : null}
  {item.status === 'published' ? <button className="queue-action review-action" onClick={() => navigate(`/research/${item.slug}`)} title="Lihat research yang diterbitkan"><Eye /><span>Lihat research</span></button> : null}
  <button onClick={() => startEdit(item)} aria-label={`Edit ${item.product_name}`} title={item.status === 'published' ? 'Edit research diterbitkan' : 'Edit maklumat produk'}><Edit3 /></button>
  {item.status === 'published' ? <button className="archive-action" onClick={() => void handleArchive(item)} aria-label={`Arkibkan ${item.product_name}`} title="Arkibkan research"><Archive /></button> : null}
  {(item.status === 'draft' || item.status === 'archived') ? <button className="danger" onClick={() => void handleDelete(item)} aria-label={`Padam ${item.product_name}`} title="Padam research"><Trash2 /></button> : null}
</div></article>)}</div>}
        </aside>
      </div>
    </>
  )
}
