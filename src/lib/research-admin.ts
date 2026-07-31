import { supabase } from './supabase'
import type { ResearchAccess, ResearchRow } from '../types/database'

export interface ResearchDraftInput {
  productName: string
  category: string
  platform: string
  price: number
  commissionAmount: number | null
  productUrl: string
  officialDescription: string
  accessLevel: ResearchAccess
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  return supabase
}

function createSlug(productName: string) {
  const base = productName.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)
  return `${base || 'research'}-${Date.now().toString(36)}`
}

export async function listAdminResearch(): Promise<ResearchRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.from('researches').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ResearchRow[]
}

export async function createResearchDraft(input: ResearchDraftInput, authorId: string, imagePath: string | null) {
  const client = requireSupabase()
  const { data, error } = await client.from('researches').insert({
    slug: createSlug(input.productName),
    product_name: input.productName.trim(),
    category: input.category,
    platform: input.platform,
    price: input.price,
    commission_amount: input.commissionAmount,
    product_url: input.productUrl.trim(),
    official_description: input.officialDescription.trim(),
    product_image_path: imagePath,
    access_level: input.accessLevel,
    author_id: authorId,
    status: 'draft',
  }).select('*').single()
  if (error) throw error
  return data as ResearchRow
}

export async function updateResearchDraft(id: string, input: ResearchDraftInput, imagePath: string | null) {
  const client = requireSupabase()
  const { data, error } = await client.from('researches').update({
    product_name: input.productName.trim(),
    category: input.category,
    platform: input.platform,
    price: input.price,
    commission_amount: input.commissionAmount,
    product_url: input.productUrl.trim(),
    official_description: input.officialDescription.trim(),
    product_image_path: imagePath,
    access_level: input.accessLevel,
  }).eq('id', id).select('*').single()
  if (error) throw error
  return data as ResearchRow
}

export async function deleteResearchDraft(item: ResearchRow) {
  const client = requireSupabase()
  const { error } = await client.from('researches').delete().eq('id', item.id)
  if (error) throw error
  if (item.product_image_path) await client.storage.from('product-images').remove([item.product_image_path])
}

export async function uploadProductImage(file: File, userId: string) {
  const client = requireSupabase()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

export async function removeProductImage(path: string) {
  const client = requireSupabase()
  const { error } = await client.storage.from('product-images').remove([path])
  if (error) throw error
}

export function getProductImageUrl(path: string | null) {
  if (!path || !supabase) return null
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}