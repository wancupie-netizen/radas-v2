import { supabase } from './supabase'

export interface ResearchAccessUsage {
  plan: 'free' | 'pro'
  used: number
  limit: number | null
  remaining: number | null
  counted: boolean
  enforcement_enabled: boolean
  access_date: string
}

export interface ResearchAccessDashboard {
  date: string
  settings: {
    starter_daily_limit: number
    activation_target: number
    timezone: string
    enforcement_enabled: boolean
  }
  metrics: {
    research_opened: number
    active_starter: number
    at_limit: number
    active_pro: number
  }
  distribution: {
    zero: number
    one_two: number
    three_four: number
    at_limit: number
  }
  library: {
    published_total: number
    published_last_7_days: number
  }
  top_research: Array<{
    id: string
    slug: string
    product_name: string
    views: number
  }>
}

export async function recordResearchAccess(researchId: string): Promise<ResearchAccessUsage> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.rpc('record_research_access', { p_research_id: researchId })
  if (error) throw error
  return data as ResearchAccessUsage
}

export async function getResearchAccessDashboard(): Promise<ResearchAccessDashboard> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.rpc('get_research_access_dashboard')
  if (error) throw error
  return data as ResearchAccessDashboard
}

export async function updateResearchAccessSettings(starterDailyLimit: number, activationTarget: number) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { error } = await supabase.rpc('update_research_access_settings', {
    p_starter_daily_limit: starterDailyLimit,
    p_activation_target: activationTarget,
  })
  if (error) throw error
}
