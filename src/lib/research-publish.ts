import { supabase } from './supabase'
import type { ResearchRow } from '../types/database'

export async function publishResearch(id: string, reviewerId: string): Promise<ResearchRow> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const now = new Date().toISOString()
  const { data, error } = await supabase.from('researches').update({
    status: 'published',
    reviewer_id: reviewerId,
    published_at: now,
    last_verified_at: now,
    integrity_status: 'reviewed',
  }).eq('id', id).select('*').single()
  if (error) throw error
  return data as ResearchRow
}

export async function archiveResearch(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { error } = await supabase.from('researches').update({ status: 'archived' }).eq('id', id)
  if (error) throw error
}