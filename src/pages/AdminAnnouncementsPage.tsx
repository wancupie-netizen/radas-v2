import { Edit3, LoaderCircle, Megaphone, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { deleteAnnouncement, listAdminAnnouncements, saveAnnouncement } from '../lib/announcements'
import type { AnnouncementAudience, AnnouncementRow, AnnouncementStatus, AnnouncementType } from '../types/database'

interface AnnouncementForm {
  title: string
  body: string
  type: AnnouncementType
  audience: AnnouncementAudience
  actionLabel: string
  actionUrl: string
  isPinned: boolean
  status: AnnouncementStatus
  expiresAt: string
}

const emptyForm = (): AnnouncementForm => ({ title: '', body: '', type: 'info', audience: 'all', actionLabel: '', actionUrl: '', isPinned: false, status: 'draft', expiresAt: '' })
const announcementDraftKey = 'radas:admin-announcement-form:v1'
const announcementEditKeyPrefix = 'radas:admin-announcement-edit:v1:'
const activeAnnouncementEditKey = 'radas:admin-announcement-active-edit:v1'

function normalizeForm(value: unknown, fallback = emptyForm()): AnnouncementForm {
  if (!value || typeof value !== 'object') return fallback
  const saved = value as Partial<AnnouncementForm>
  return {
    title: typeof saved.title === 'string' ? saved.title : fallback.title,
    body: typeof saved.body === 'string' ? saved.body : fallback.body,
    type: saved.type === 'info' || saved.type === 'update' || saved.type === 'important' ? saved.type : fallback.type,
    audience: saved.audience === 'all' || saved.audience === 'starter' || saved.audience === 'pro' ? saved.audience : fallback.audience,
    actionLabel: typeof saved.actionLabel === 'string' ? saved.actionLabel : fallback.actionLabel,
    actionUrl: typeof saved.actionUrl === 'string' ? saved.actionUrl : fallback.actionUrl,
    isPinned: typeof saved.isPinned === 'boolean' ? saved.isPinned : fallback.isPinned,
    status: saved.status === 'draft' || saved.status === 'published' ? saved.status : fallback.status,
    expiresAt: typeof saved.expiresAt === 'string' ? saved.expiresAt : fallback.expiresAt,
  }
}

function readStoredForm(key: string, fallback = emptyForm()) {
  try {
    const saved = window.localStorage.getItem(key)
    return saved ? normalizeForm(JSON.parse(saved), fallback) : fallback
  } catch {
    window.localStorage.removeItem(key)
    return fallback
  }
}

export function AdminAnnouncementsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<AnnouncementRow[]>([])
  const [form, setForm] = useState(() => readStoredForm(announcementDraftKey))
  const [editing, setEditing] = useState<AnnouncementRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() { setItems(await listAdminAnnouncements()) }
  useEffect(() => { let active = true; listAdminAnnouncements().then((data) => { if (active) setItems(data) }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Senarai tidak dapat dimuatkan.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  useEffect(() => {
    const key = editing ? `${announcementEditKeyPrefix}${editing.id}` : announcementDraftKey
    window.localStorage.setItem(key, JSON.stringify(form))
  }, [editing, form])
  useEffect(() => {
    const activeId = window.localStorage.getItem(activeAnnouncementEditKey)
    if (!activeId || editing) return
    const activeItem = items.find((item) => item.id === activeId)
    if (!activeItem) return
    const databaseForm: AnnouncementForm = { title: activeItem.title, body: activeItem.body, type: activeItem.type, audience: activeItem.audience, actionLabel: activeItem.action_label ?? '', actionUrl: activeItem.action_url ?? '', isPinned: activeItem.is_pinned, status: activeItem.status, expiresAt: activeItem.expires_at ? activeItem.expires_at.slice(0, 16) : '' }
    setEditing(activeItem)
    setForm(readStoredForm(`${announcementEditKeyPrefix}${activeItem.id}`, databaseForm))
  }, [editing, items])

  function reset() {
    if (editing) window.localStorage.removeItem(`${announcementEditKeyPrefix}${editing.id}`)
    else window.localStorage.removeItem(announcementDraftKey)
    window.localStorage.removeItem(activeAnnouncementEditKey)
    setEditing(null); setForm(emptyForm()); setMessage(null); setError(null)
  }
  function edit(item: AnnouncementRow) {
    const databaseForm: AnnouncementForm = { title: item.title, body: item.body, type: item.type, audience: item.audience, actionLabel: item.action_label ?? '', actionUrl: item.action_url ?? '', isPinned: item.is_pinned, status: item.status, expiresAt: item.expires_at ? item.expires_at.slice(0, 16) : '' }
    window.localStorage.setItem(activeAnnouncementEditKey, item.id)
    setEditing(item)
    setForm(readStoredForm(`${announcementEditKeyPrefix}${item.id}`, databaseForm))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!user) return; setSaving(true); setError(null); setMessage(null)
    try {
      await saveAnnouncement({ ...form, publishedAt: editing?.published_at }, user.id, editing?.id)
      if (editing) window.localStorage.removeItem(`${announcementEditKeyPrefix}${editing.id}`)
      else window.localStorage.removeItem(announcementDraftKey)
      window.localStorage.removeItem(activeAnnouncementEditKey)
      await refresh(); setMessage(editing ? 'Pengumuman berjaya dikemas kini.' : 'Pengumuman berjaya disimpan.'); setEditing(null); setForm(emptyForm())
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Pengumuman tidak dapat disimpan.') }
    finally { setSaving(false) }
  }
  async function remove(item: AnnouncementRow) {
    if (!window.confirm(`Padam pengumuman “${item.title}”?`)) return
    try { await deleteAnnouncement(item.id); await refresh(); if (editing?.id === item.id) reset() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Pengumuman tidak dapat dipadam.') }
  }

  return <>
    <section className="page-heading"><span className="eyebrow">Komunikasi pengguna</span><h1>Urus pengumuman</h1><p>Terbitkan berita RADAS kepada semua pengguna atau pelan tertentu.</p></section>
    <div className="announcement-admin-layout">
      <form className="profile-panel announcement-form" onSubmit={(event) => void submit(event)}>
        <div className="profile-panel-heading"><span className="settings-icon"><Megaphone /></span><div><h2>{editing ? 'Edit pengumuman' : 'Pengumuman baharu'}</h2><p>Draf tidak akan kelihatan kepada pengguna.</p></div></div>
        {error ? <div className="studio-message error" role="alert">{error}</div> : null}{message ? <div className="studio-message success" role="status">{message}</div> : null}
        <div className="announcement-form-grid">
          <label className="field full"><span>Tajuk</span><input required minLength={3} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="field full"><span>Kandungan</span><textarea required minLength={3} maxLength={4000} rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <label className="field"><span>Jenis</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AnnouncementType })}><option value="info">Makluman</option><option value="update">Kemas kini</option><option value="important">Penting</option></select></label>
          <label className="field"><span>Audiens</span><select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as AnnouncementAudience })}><option value="all">Semua pengguna</option><option value="starter">Pelan Starter</option><option value="pro">Pelan Pro</option></select></label>
          <label className="field"><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AnnouncementStatus })}><option value="draft">Draf</option><option value="published">Terbitkan</option></select></label>
          <label className="field"><span>Tarikh luput (pilihan)</span><input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
          <label className="field"><span>Label pautan (pilihan)</span><input placeholder="Contoh: Ketahui lanjut" value={form.actionLabel} onChange={(e) => setForm({ ...form, actionLabel: e.target.value })} /></label>
          <label className="field"><span>URL pautan (pilihan)</span><input type="text" placeholder="https://... atau /research" value={form.actionUrl} onChange={(e) => setForm({ ...form, actionUrl: e.target.value })} /></label>
          <label className="announcement-check full"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /><span>Pin pada dashboard pengguna</span></label>
        </div>
        <div className="announcement-form-actions"><button className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? 'Menyimpan...' : editing ? 'Simpan perubahan' : 'Simpan pengumuman'}</button>{editing ? <button className="button button-secondary" type="button" onClick={reset}>Batal</button> : null}</div>
      </form>
      <section className="announcement-admin-list"><div className="section-heading"><div><span className="eyebrow">Rekod</span><h2>Semua pengumuman</h2></div><button className="button button-secondary" onClick={reset}><Plus size={16} /> Baharu</button></div>
        {loading ? <div className="library-state"><LoaderCircle className="spin" /></div> : items.length === 0 ? <div className="library-state"><Megaphone /><p>Belum ada pengumuman.</p></div> : items.map((item) => <article key={item.id}><div><div className="announcement-meta"><span>{item.audience === 'starter' ? 'Starter' : item.audience === 'pro' ? 'Pro' : 'Semua'} · {item.status === 'published' ? 'Diterbitkan' : 'Draf'}{item.is_pinned ? ' · Dipin' : ''}</span></div><h3>{item.title}</h3><p>{item.body}</p></div><div><button className="icon-button" title="Edit" onClick={() => edit(item)}><Edit3 /></button><button className="icon-button danger" title="Padam" onClick={() => void remove(item)}><Trash2 /></button></div></article>)}
      </section>
    </div>
  </>
}
