import { Filter, LoaderCircle, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LiveResearchCard } from '../components/LiveResearchCard'
import { LockedProResearchCard } from '../components/LockedProResearchCard'
import { useAuth } from '../auth/AuthContext'
import { listProResearchTeasers, listPublishedResearch } from '../lib/database'
import type { ProResearchTeaser, ResearchRow } from '../types/database'

type LibraryEntry =
  | { kind: 'research'; item: ResearchRow }
  | { kind: 'pro-teaser'; item: ProResearchTeaser }

export function ResearchLibraryPage() {
  const { profile } = useAuth()
  const profileRole = profile?.role
  const profilePlan = profile?.plan
  const shouldLoadProTeasers = profileRole === 'subscriber' && profilePlan === 'free'
  const [query, setQuery] = useState('')
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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const entries: LibraryEntry[] = [
      ...research.map((item): LibraryEntry => ({ kind: 'research', item })),
      ...proTeasers.map((item): LibraryEntry => ({ kind: 'pro-teaser', item })),
    ]
    const matching = term
      ? entries.filter(({ item }) => `${item.product_name} ${item.category} ${item.platform}`.toLowerCase().includes(term))
      : entries
    return matching.toSorted((a, b) => new Date(b.item.published_at ?? 0).getTime() - new Date(a.item.published_at ?? 0).getTime())
  }, [query, research, proTeasers])

  return (
    <>
      <section className="page-heading heading-row"><div><span className="eyebrow">Curated product research</span><h1>Research Library</h1><p>Peluang produk yang sudah melalui AI generation dan semakan editorial RADAS.</p></div><button className="button button-secondary"><SlidersHorizontal /> Susun research</button></section>
      <div className="library-toolbar"><label className="library-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, kategori atau platform" /></label><button className="button button-secondary"><Filter /> Semua kategori</button></div>
      {loading ? <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan research diterbitkan...</p></div> : error ? <div className="library-state error"><p>{error}</p></div> : filtered.length === 0 ? <div className="library-state"><h2>Belum ada research diterbitkan</h2><p>Research akan muncul selepas diluluskan oleh admin.</p></div> : <><div className="result-line"><span>{filtered.length} research ditemui</span><span>Dikemas kini secara editorial</span></div><section className="research-grid">{filtered.map((entry) => entry.kind === 'research' ? <LiveResearchCard item={entry.item} key={`research-${entry.item.id}`} /> : <LockedProResearchCard item={entry.item} key={`pro-${entry.item.id}`} />)}</section></>}
    </>
  )
}
