export type Verdict = 'Layak Diuji' | 'Perlu Dipantau' | 'Tidak Disyorkan'

export interface ResearchItem {
  id: string
  name: string
  category: string
  platform: string
  price: string
  commission: string
  verdict: Verdict
  summary: string
  updatedAt: string
  accent: string
}