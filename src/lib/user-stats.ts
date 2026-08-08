import { supabase } from './supabase'

export interface AdminUserStats {
  total: number
  starter: number
  pro: number
  joinedThisWeek: number
}

function startOfCurrentWeek() {
  const date = new Date()
  const day = date.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - daysSinceMonday)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export async function getAdminUserStats(): Promise<AdminUserStats> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const [totalResult, starterResult, proResult, weekResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'free'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfCurrentWeek()),
  ])

  const error = totalResult.error ?? starterResult.error ?? proResult.error ?? weekResult.error
  if (error) throw error

  return {
    total: totalResult.count ?? 0,
    starter: starterResult.count ?? 0,
    pro: proResult.count ?? 0,
    joinedThisWeek: weekResult.count ?? 0,
  }
}
