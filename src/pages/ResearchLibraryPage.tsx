import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ResearchCard } from '../components/ResearchCard'
import { researchItems } from '../data/research'

export function ResearchLibraryPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? researchItems.filter((item) => `${item.name} ${item.category} ${item.platform}`.toLowerCase().includes(term)) : researchItems
  }, [query])

  return (
    <>
      <section className="page-heading heading-row">
        <div><span className="eyebrow">Curated product research</span><h1>Research Library</h1><p>Cari peluang produk berdasarkan konteks, bukan sekadar komisen atau populariti.</p></div>
        <button className="button button-secondary"><SlidersHorizontal size={17} /> Susun research</button>
      </section>
      <div className="library-toolbar">
        <label className="library-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, kategori atau platform" /></label>
        <button className="button button-secondary"><Filter size={17} /> Semua kategori</button>
      </div>
      <div className="result-line"><span>{filtered.length} research ditemui</span><span>Dikemas kini secara editorial</span></div>
      <section className="research-grid">{filtered.map((item) => <ResearchCard item={item} key={item.id} />)}</section>
    </>
  )
}