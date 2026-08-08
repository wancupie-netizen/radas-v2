import { Bell, Check, CheckCheck, LoaderCircle, Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listAnnouncementFeed, markAnnouncementsRead } from '../lib/announcements'
import type { AnnouncementFeedItem } from '../types/database'

export function AnnouncementsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<AnnouncementFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (!user) return; let active = true; listAnnouncementFeed(user.id).then((data) => { if (active) setItems(data) }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Pengumuman tidak dapat dimuatkan.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [user])
  async function mark(ids: string[]) { if (!user) return; await markAnnouncementsRead(user.id, ids); setItems((current) => current.map((item) => ids.includes(item.id) ? { ...item, is_read: true } : item)) }
  const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id)
  return <>
    <section className="page-heading heading-row"><div><span className="eyebrow">RADAS Update</span><h1>Pengumuman</h1><p>Berita produk, penyelenggaraan dan kemas kini penting untuk akaun anda.</p></div>{unreadIds.length > 0 ? <button className="button button-secondary" onClick={() => void mark(unreadIds)}><CheckCheck size={17} /> Tandakan semua dibaca</button> : null}</section>
    {loading ? <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan pengumuman...</p></div> : error ? <div className="library-state error"><p>{error}</p></div> : items.length === 0 ? <div className="library-state"><Bell /><h2>Belum ada pengumuman</h2><p>Berita RADAS akan dipaparkan di sini.</p></div> : <div className="announcement-feed">{items.map((item) => <article className={`${item.type} ${item.is_read ? '' : 'unread'}`} key={item.id}><span className="announcement-card-icon"><Megaphone /></span><div><div className="announcement-meta"><span>{item.type === 'important' ? 'Penting' : item.type === 'update' ? 'Kemas kini' : 'Makluman'}</span><time>{item.published_at ? new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium' }).format(new Date(item.published_at)) : ''}</time></div><h2>{item.title}</h2><p>{item.body}</p>{item.action_url && item.action_label ? <a href={item.action_url} target={item.action_url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{item.action_label}</a> : null}</div>{!item.is_read ? <button className="icon-button" title="Tandakan dibaca" onClick={() => void mark([item.id])}><Check size={17} /></button> : null}</article>)}</div>}
  </>
}
