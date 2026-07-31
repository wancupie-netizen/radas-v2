import type { ResearchItem } from '../types/research'

export const researchItems: ResearchItem[] = [
  {
    id: 'portable-blender-pro',
    name: 'Portable Blender Pro',
    category: 'Home & Living',
    platform: 'TikTok Shop',
    price: 'RM39.90',
    commission: 'RM7.98',
    verdict: 'Layak Diuji',
    summary: 'Masalah mudah difahami, demonstrasi visual kuat dan sesuai untuk content rutin harian.',
    updatedAt: 'Hari ini',
    accent: '#22cdb8',
  },
  {
    id: 'magnetic-phone-holder',
    name: 'Magnetic Phone Holder',
    category: 'Automotive',
    platform: 'Shopee Affiliate',
    price: 'RM24.50',
    commission: 'RM3.68',
    verdict: 'Layak Diuji',
    summary: 'Produk penyelesaian masalah dengan peluang demo sebelum dan selepas yang jelas.',
    updatedAt: 'Semalam',
    accent: '#258cff',
  },
  {
    id: 'smart-posture-corrector',
    name: 'Smart Posture Corrector',
    category: 'Health & Wellness',
    platform: 'Involve Asia',
    price: 'RM89.00',
    commission: 'RM8.90',
    verdict: 'Perlu Dipantau',
    summary: 'Pain point menarik tetapi memerlukan bukti produk dan positioning yang berhati-hati.',
    updatedAt: '28 Jul 2026',
    accent: '#f59e0b',
  },
]

export function getResearchById(id: string | undefined) {
  return researchItems.find((item) => item.id === id)
}
