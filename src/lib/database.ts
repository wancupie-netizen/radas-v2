import { supabase } from './supabase'
import type { ResearchRow } from '../types/database'

export async function listPublishedResearch(): Promise<ResearchRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('researches')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ResearchRow[]
}

export async function getPublishedResearchBySlug(slug: string): Promise<ResearchRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('researches')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  return data as ResearchRow | null
}