import { Filter, LoaderCircle, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LiveResearchCard } from '../components/LiveResearchCard'
import { listPublishedResearch } from '../lib/database'
import type { ResearchRow } from '../types/database'

export function ResearchLibraryPage() {
  const [query, setQuery] = useState('')
  const [research, setResearch] = useState<ResearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listPublishedResearch().then((items) => { if (active) setResearch(items) }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Research tidak dapat dimuatkan.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? research.filter((item) => `${item.product_name} ${item.category} ${item.platform}`.toLowerCase().includes(term)) : research
  }, [query, research])

  return (
    <>
      <section className="page-heading heading-row"><div><span className="eyebrow">Curated product research</span><h1>Research Library</h1><p>Peluang produk yang sudah melalui AI generation dan semakan editorial RADAS.</p></div><button className="button button-secondary"><SlidersHorizontal /> Susun research</button></section>
      <div className="library-toolbar"><label className="library-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, kategori atau platform" /></label><button className="button button-secondary"><Filter /> Semua kategori</button></div>
      {loading ? <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan research diterbitkan...</p></div> : error ? <div className="library-state error"><p>{error}</p></div> : filtered.length === 0 ? <div className="library-state"><h2>Belum ada research diterbitkan</h2><p>Research akan muncul selepas diluluskan oleh admin.</p></div> : <><div className="result-line"><span>{filtered.length} research ditemui</span><span>Dikemas kini secara editorial</span></div><section className="research-grid">{filtered.map((item) => <LiveResearchCard item={item} key={item.id} />)}</section></>}
    </>
  )
}