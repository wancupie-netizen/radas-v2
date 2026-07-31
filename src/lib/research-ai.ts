import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { ResearchRow, ResearchVerdict } from '../types/database'

export interface ContentAngle { title: string; hook: string; rationale: string }
export interface PlaybookStep { step: string; action: string; notes: string }
export interface AIResearchOutput {
  research_snapshot: string
  product_pain: string
  verdict: ResearchVerdict
  verdict_reason: string
  research_insight: string
  suitable_for: string[]
  content_angles: ContentAngle[]
  execution_playbook: PlaybookStep[]
}

export async function generateResearch(researchId: string) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.functions.invoke('generate-research', { body: { researchId } })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const details = await error.context.json().catch(() => null)
      throw new Error(details?.error || error.message)
    }
    throw error
  }
  return data as { researchId: string; runId: string; model: string; output: AIResearchOutput }
}

export async function getResearchForReview(id: string): Promise<ResearchRow> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.from('researches').select('*').eq('id', id).single()
  if (error) throw error
  return data as ResearchRow
}

export async function saveResearchReview(id: string, output: AIResearchOutput) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.from('researches').update({
    research_snapshot: output.research_snapshot,
    product_pain: output.product_pain,
    verdict: output.verdict,
    verdict_reason: output.verdict_reason,
    research_insight: output.research_insight,
    suitable_for: output.suitable_for,
    content_angles: output.content_angles,
    execution_playbook: output.execution_playbook,
    status: 'in_review',
  }).eq('id', id).select('*').single()
  if (error) throw error
  return data as ResearchRow
}