import { ArrowRight, Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLatestPinnedAnnouncement } from '../lib/announcements'
import type { AnnouncementRow } from '../types/database'

export function AnnouncementBanner() {
  const [item, setItem] = useState<AnnouncementRow | null>(null)
  useEffect(() => { let active = true; getLatestPinnedAnnouncement().then((data) => { if (active) setItem(data) }).catch(() => undefined); return () => { active = false } }, [])
  if (!item) return null
  const external = item.action_url?.startsWith('http')
  return <section className={`announcement-banner ${item.type}`}><span className="announcement-banner-icon"><Megaphone /></span><div><span>{item.type === 'important' ? 'Pengumuman penting' : 'RADAS Update'}</span><h2>{item.title}</h2><p>{item.body}</p></div>{item.action_url && item.action_label ? external ? <a className="button button-secondary" href={item.action_url} target="_blank" rel="noreferrer">{item.action_label} <ArrowRight size={16} /></a> : <Link className="button button-secondary" to={item.action_url}>{item.action_label} <ArrowRight size={16} /></Link> : null}</section>
}
