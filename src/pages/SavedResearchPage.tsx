import { Bookmark, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LiveResearchCard } from '../components/LiveResearchCard'
import { listSavedResearch } from '../lib/watchlist'
import type { ResearchRow } from '../types/database'

export function SavedResearchPage() {
  const { user } = useAuth()
  const [research, setResearch] = useState<ResearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true); setError(null)
    listSavedResearch(user.id)
      .then((items) => { if (active) setResearch(items) })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Research tersimpan tidak dapat dimuatkan.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  return (
    <>
      <section className="page-heading"><span className="eyebrow">Watchlist peribadi</span><h1>Research Tersimpan</h1><p>Simpan research yang ingin dirujuk, diuji atau digunakan semasa merancang content.</p></section>
      {loading ? <div className="library-state"><LoaderCircle className="spin" /><p>Memuatkan research tersimpan...</p></div>
        : error ? <div className="library-state error"><p>{error}</p></div>
          : research.length === 0 ? <div className="library-state saved-empty"><Bookmark /><h2>Belum ada research tersimpan</h2><p>Buka Research Library dan tekan â€œSimpan researchâ€ pada produk yang mahu dirujuk kemudian.</p><Link className="button button-primary" to="/research">Buka Research Library</Link></div>
            : <><div className="result-line"><span>{research.length} research tersimpan</span><span>Untuk akaun anda sahaja</span></div><section className="research-grid">{research.map((item) => <LiveResearchCard item={item} key={item.id} />)}</section></>}
    </>
  )
}