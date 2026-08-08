import { Bell, CheckCheck, Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listAnnouncementFeed, markAnnouncementsRead } from '../lib/announcements'
import type { AnnouncementFeedItem } from '../types/database'

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AnnouncementFeedItem[]>([])

  useEffect(() => {
    if (!user) return
    let active = true
    listAnnouncementFeed(user.id).then((data) => { if (active) setItems(data) }).catch(() => undefined)
    return () => { active = false }
  }, [user])

  const unread = items.filter((item) => !item.is_read)

  async function markAll() {
    if (!user) return
    await markAnnouncementsRead(user.id, unread.map((item) => item.id))
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  return <div className="notification-wrap">
    <button className="icon-button notification-button" aria-label={`${unread.length} pengumuman belum dibaca`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Bell size={19} />{unread.length > 0 ? <span>{unread.length > 9 ? '9+' : unread.length}</span> : null}
    </button>
    {open ? <div className="notification-popover">
      <div className="notification-head"><div><span>RADAS Update</span><strong>Pengumuman</strong></div>{unread.length > 0 ? <button onClick={() => void markAll()}><CheckCheck size={15} /> Baca semua</button> : null}</div>
      <div className="notification-list">
        {items.slice(0, 5).map((item) => <Link className={item.is_read ? '' : 'unread'} to="/announcements" key={item.id} onClick={() => setOpen(false)}><span className={`notification-type ${item.type}`}><Megaphone size={16} /></span><div><small>{item.type === 'important' ? 'Penting' : item.type === 'update' ? 'Kemas kini' : 'Makluman'}</small><strong>{item.title}</strong><p>{item.body}</p></div></Link>)}
        {items.length === 0 ? <div className="notification-empty"><Bell /><strong>Tiada pengumuman baharu</strong><p>Berita RADAS akan dipaparkan di sini.</p></div> : null}
      </div>
      <Link className="notification-footer" to="/announcements" onClick={() => setOpen(false)}>Lihat semua pengumuman</Link>
    </div> : null}
  </div>
}
