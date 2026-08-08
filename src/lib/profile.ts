import { supabase } from './supabase'
import type { ProfileRow } from '../types/database'

export async function updateOwnProfile(userId: string, fullName: string): Promise<ProfileRow> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as ProfileRow
}

export async function updateOwnPassword(password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
