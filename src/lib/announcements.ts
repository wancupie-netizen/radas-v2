import { supabase } from './supabase'
import type { AnnouncementAudience, AnnouncementFeedItem, AnnouncementRow, AnnouncementStatus, AnnouncementType } from '../types/database'

export interface AnnouncementInput {
  title: string
  body: string
  type: AnnouncementType
  audience: AnnouncementAudience
  actionLabel: string
  actionUrl: string
  isPinned: boolean
  status: AnnouncementStatus
  expiresAt: string
  publishedAt?: string | null
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase
}

export async function listAnnouncementFeed(userId: string): Promise<AnnouncementFeedItem[]> {
  const client = requireSupabase()
  const [announcementsResult, readsResult] = await Promise.all([
    client.from('announcements').select('*').order('published_at', { ascending: false }),
    client.from('announcement_reads').select('announcement_id').eq('user_id', userId),
  ])
  if (announcementsResult.error) throw announcementsResult.error
  if (readsResult.error) throw readsResult.error
  const readIds = new Set((readsResult.data ?? []).map((item) => item.announcement_id as string))
  return (announcementsResult.data as AnnouncementRow[]).map((item) => ({ ...item, is_read: readIds.has(item.id) }))
}

export async function markAnnouncementsRead(userId: string, announcementIds: string[]) {
  if (announcementIds.length === 0) return
  const { error } = await requireSupabase().from('announcement_reads').upsert(
    announcementIds.map((announcementId) => ({ user_id: userId, announcement_id: announcementId })),
    { onConflict: 'user_id,announcement_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

export async function getLatestPinnedAnnouncement() {
  const { data, error } = await requireSupabase().from('announcements').select('*').eq('is_pinned', true).order('published_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data as AnnouncementRow | null
}

export async function listAdminAnnouncements() {
  const { data, error } = await requireSupabase().from('announcements').select('*').is('recipient_user_id', null).order('created_at', { ascending: false })
  if (error) throw error
  return data as AnnouncementRow[]
}

export async function saveAnnouncement(input: AnnouncementInput, adminId: string, id?: string) {
  const client = requireSupabase()
  const payload = {
    title: input.title.trim(), body: input.body.trim(), type: input.type, audience: input.audience,
    action_label: input.actionLabel.trim() || null, action_url: input.actionUrl.trim() || null,
    is_pinned: input.isPinned, status: input.status,
    published_at: input.status === 'published' ? input.publishedAt ?? new Date().toISOString() : null,
    expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
  }
  const query = id
    ? client.from('announcements').update(payload).eq('id', id)
    : client.from('announcements').insert({ ...payload, created_by: adminId })
  const { error } = await query
  if (error) throw error
}

export async function deleteAnnouncement(id: string) {
  const { error } = await requireSupabase().from('announcements').delete().eq('id', id)
  if (error) throw error
}
