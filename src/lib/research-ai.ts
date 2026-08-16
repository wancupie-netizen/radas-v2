import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { ResearchBrief, ResearchRow, ResearchVerdict } from '../types/database'

export interface ContentAngle { title: string; hook: string; rationale: string }
export interface PlaybookStep { step: string; action: string; notes: string }
export interface AIResearchOutput {
  research_snapshot: string
  research_brief: ResearchBrief
  product_pain: string
  verdict: ResearchVerdict
  verdict_reason: string
  research_insight: string
  suitable_for: string[]
  content_angles: ContentAngle[]
  execution_playbook: PlaybookStep[]
}

export function validateResearchBrief(brief: ResearchBrief) {
  if (!brief.summary.trim() || !brief.demand.trim() || !brief.content_opportunity.trim() || !brief.risk.trim()) return 'Lengkapkan semua medan Paparan Ringkas Pengguna.'
  if (brief.summary.length > 320 || brief.demand.length > 120 || brief.content_opportunity.length > 140 || brief.risk.length > 160) return 'Teks Paparan Ringkas Pengguna melebihi had aksara.'
  if (brief.facts.length < 1 || brief.facts.length > 4 || brief.facts.some((fact) => !fact.label.trim() || !fact.value.trim())) return 'Sediakan antara 1 hingga 4 fakta utama yang lengkap.'
  if (brief.verification_items.length > 6) return 'Had maksimum ialah 6 perkara untuk disahkan.'
  return null
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
  const briefError = validateResearchBrief(output.research_brief)
  if (briefError) throw new Error(briefError)
  const { data, error } = await supabase.from('researches').update({
    research_snapshot: output.research_snapshot,
    research_brief: output.research_brief,
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
