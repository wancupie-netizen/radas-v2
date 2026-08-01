import { supabase } from './supabase'
import type { ResearchRow } from '../types/database'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase
}

export async function isResearchSaved(userId: string, researchId: string): Promise<boolean> {
  const client = requireSupabase()
  const { data, error } = await client.from('watchlists').select('research_id').eq('user_id', userId).eq('research_id', researchId).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function saveResearch(userId: string, researchId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('watchlists').upsert({ user_id: userId, research_id: researchId }, { onConflict: 'user_id,research_id' })
  if (error) throw error
}

export async function removeSavedResearch(userId: string, researchId: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('watchlists').delete().eq('user_id', userId).eq('research_id', researchId)
  if (error) throw error
}

export async function listSavedResearch(userId: string): Promise<ResearchRow[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('watchlists')
    .select('created_at, researches(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).flatMap((row) => {
    const related = row.researches as unknown as ResearchRow | ResearchRow[] | null
    if (!related) return []
    return Array.isArray(related) ? related : [related]
  })
}