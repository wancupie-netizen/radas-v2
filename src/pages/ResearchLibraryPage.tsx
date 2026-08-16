import { ArrowDownUp, Filter, LoaderCircle, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LiveResearchCard } from '../components/LiveResearchCard'
import { LockedProResearchCard } from '../components/LockedProResearchCard'
import { useAuth } from '../auth/AuthContext'
import { listProResearchTeasers, listPublishedResearch } from '../lib/database'
import type { ProResearchTeaser, ResearchRow } from '../types/database'

type LibraryEntry =
  | { kind: 'research'; item: ResearchRow }
  | { kind: 'pro-teaser'; item: ProResearchTeaser }

type SortKey = 'newest' | 'commission_desc' | 'price_asc' | 'price_desc' | 'name_asc'

export function ResearchLibraryPage() {
  const { profile } = useAuth()
  const profileRole = profile?.role
  const profilePlan = profile?.plan
  const shouldLoadProTeasers = profileRole === 'subscriber' && profilePlan === 'free'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [research, setResearch] = useState<ResearchRow[]>([])
  const [proTeasers, setProTeasers] = useState<ProResearchTeaser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileRole || !profilePlan) return
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([
      listPublishedResearch(),
      shouldLoadProTeasers ? listProResearchTeasers() : Promise.resolve([]),
    ]).then(([items, teasers]) => {
      if (!active) return
      setResearch(items)
      setProTeasers(teasers)
    }).catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : 'Research tidak dapat dimuatkan.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [profileRole, profilePlan, shouldLoadProTeasers])

  const entries = useMemo<LibraryEntry[]>(() => [
      ...research.map((item): LibraryEntry => ({ kind: 'research', item })),
      ...proTeasers.map((item): LibraryEntry => ({ kind: 'pro-teaser', item })),
  ], [research, proTeasers])

  const categories = useMemo(() => Array.from(new Set(entries.map(({ item }) => item.category))).toSorted((a, b) => a.localeCompare(b, 'ms')), [entries])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('ms')
    const matching = entries.filter(({ item }) => {
      const matchesSearch = !term || `${item.product_name} ${item.category} ${item.platform}`.toLocaleLowerCase('ms').includes(term)
      const matchesCategory = category === 'all' || item.category === category
      return matchesSearch && matchesCategory
    })

    return matching.toSorted((a, b) => {
      if (sortBy === 'commission_desc') return Number(b.item.commission_amount ?? -1) - Number(a.item.commission_amount ?? -1)
      if (sortBy === 'price_asc') return Number(a.item.price) - Number(b.item.price)
      if (sortBy === 'price_desc') return Number(b.item.price) - Number(a.item.price)
      if (sortBy === 'name_asc') return a.item.product_name.localeCompare(b.item.product_name, 'ms')
      return new Date(b.item.published_at ?? 0).getTime() - new Date(a.item.published_at ?? 0).getTime()
    })
  }, [category, entries, query, sortBy])

  const hasActiveFilters = query.trim().length > 0 || category !== 'all' || sortBy !== 'newest'

  function clearFilters() {
    setQuery('')
    setCategory('all')
    setSortBy('newest')
  }

  return (
    <div className="research-library-page">
      <section className="page-heading"><span className="eyebrow">Curated product research</span><h1>Research Library</h1><p>Peluang produk yang sudah melalui AI generation dan semakan editorial RADAS.</p></section>
      <div className="library-toolbar">
        <label className="library-search"><Search /><input aria-label="Cari research" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, kategori atau platform" /></label>
        <label className="library-select"><Filter /><select aria-label="Tapis mengikut kategori" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Semua kategori</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label className="library-select sort-select"><ArrowDownUp /><select aria-label="Susun research" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}><option value="newest">Terbaharu</option><option value="commission_desc">Komisen tertinggi</option><option value="price_asc">Harga terendah</option><option value="price_desc">Harga tertinggi</option><option value="name_asc">Nama A–Z</option></select></label>
        {hasActiveFilters ? <button className="library-clear" type="button" onClick={clearFilters}><X /> Kosongkan</button> : null}
      </div>
      {loading ? <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan research diterbitkan...</p></div> : error ? <div className="library-state error"><p>{error}</p></div> : filtered.length === 0 ? <div className="library-state"><h2>Tiada research sepadan</h2><p>Cuba kata carian atau kategori yang lain.</p>{hasActiveFilters ? <button className="button button-secondary" type="button" onClick={clearFilters}>Kosongkan tapisan</button> : null}</div> : <><div className="result-line"><span>{filtered.length} research ditemui</span><span>Disusun: {sortBy === 'newest' ? 'Terbaharu' : sortBy === 'commission_desc' ? 'Komisen tertinggi' : sortBy === 'price_asc' ? 'Harga terendah' : sortBy === 'price_desc' ? 'Harga tertinggi' : 'Nama A–Z'}</span></div><section className="research-grid">{filtered.map((entry) => entry.kind === 'research' ? <LiveResearchCard item={entry.item} key={`research-${entry.item.id}`} /> : <LockedProResearchCard item={entry.item} key={`pro-${entry.item.id}`} />)}</section></>}
    </div>
  )
}
