export type AppRole = 'admin' | 'editor' | 'subscriber'
export type SubscriptionPlan = 'free' | 'pro'
export type ResearchStatus = 'draft' | 'ai_generated' | 'in_review' | 'published' | 'archived'
export type ResearchAccess = 'free' | 'pro'
export type ResearchVerdict = 'layak_diuji' | 'perlu_dipantau' | 'tidak_disyorkan'
export type GenerationStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface ProfileRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: AppRole
  plan: SubscriptionPlan
  created_at: string
  updated_at: string
}

export interface ResearchRow {
  id: string
  slug: string
  product_name: string
  category: string
  platform: string
  price: number
  commission_amount: number | null
  commission_rate: number | null
  product_url: string
  official_description: string
  product_image_path: string | null
  research_snapshot: string | null
  verdict: ResearchVerdict | null
  verdict_reason: string | null
  research_insight: string | null
  execution_playbook: Record<string, unknown>[]
  suitable_for: string[]
  content_angles: Record<string, unknown>[]
  status: ResearchStatus
  access_level: ResearchAccess
  is_featured: boolean
  author_id: string
  reviewer_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ResearchGenerationRow {
  id: string
  research_id: string
  requested_by: string
  status: GenerationStatus
  provider: string | null
  model: string | null
  prompt_version: string
  input_snapshot: Record<string, unknown>
  output_snapshot: Record<string, unknown> | null
  input_tokens: number | null
  output_tokens: number | null
  estimated_cost_usd: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}