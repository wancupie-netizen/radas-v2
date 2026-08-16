import { BarChart3, BookOpenCheck, Check, Crown, Eye, LoaderCircle, LockKeyhole, Save, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getResearchAccessDashboard, updateResearchAccessSettings } from '../lib/research-access'
import type { ResearchAccessDashboard as AccessDashboard } from '../lib/research-access'

export function ResearchAccessDashboard() {
  const [data, setData] = useState<AccessDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dailyLimit, setDailyLimit] = useState(5)
  const [activationTarget, setActivationTarget] = useState(20)

  async function loadDashboard() {
    const dashboard = await getResearchAccessDashboard()
    setData(dashboard)
    setDailyLimit(dashboard.settings.starter_daily_limit)
    setActivationTarget(dashboard.settings.activation_target)
  }

  useEffect(() => {
    let active = true
    getResearchAccessDashboard()
      .then((dashboard) => {
        if (!active) return
        setData(dashboard)
        setDailyLimit(dashboard.settings.starter_daily_limit)
        setActivationTarget(dashboard.settings.activation_target)
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Data akses tidak dapat dimuatkan.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const progress = data ? Math.min(Math.round((data.library.published_total / data.settings.activation_target) * 100), 100) : 0

  async function saveSettings() {
    setSaving(true); setSaved(false); setError(null)
    try {
      await updateResearchAccessSettings(dailyLimit, activationTarget)
      await loadDashboard()
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Tetapan tidak dapat disimpan.')
    } finally { setSaving(false) }
  }

  return (
    <section className="access-dashboard-section">
      <div className="section-heading">
        <div><span className="eyebrow">Akses & Kuota Research</span><h2>Pemerhatian penggunaan Starter</h2><p>Setiap research unik dikira sekali sehari mengikut waktu Malaysia.</p></div>
        <span className="observation-badge"><i /> Mod pemerhatian</span>
      </div>

      {loading ? <div className="access-dashboard-state"><LoaderCircle className="spin" /> Memuatkan data akses...</div> : null}
      {error ? <div className="studio-message error" role="alert"><span>{error}</span></div> : null}

      {data ? <>
        <div className="access-metric-grid">
          <article><span><Eye /></span><div><small>Research dibuka hari ini</small><strong>{data.metrics.research_opened}</strong></div></article>
          <article><span><Users /></span><div><small>Starter aktif</small><strong>{data.metrics.active_starter}</strong></div></article>
          <article><span><LockKeyhole /></span><div><small>Mencapai kuota</small><strong>{data.metrics.at_limit}</strong></div></article>
          <article><span><Crown /></span><div><small>Pro aktif</small><strong>{data.metrics.active_pro}</strong></div></article>
        </div>

        <div className="access-dashboard-grid">
          <article className="access-panel">
            <div className="access-panel-heading"><div><BarChart3 /><span><strong>Taburan Starter</strong><small>Penggunaan research unik hari ini</small></span></div><time>{new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium' }).format(new Date(`${data.date}T12:00:00`))}</time></div>
            <div className="quota-distribution">
              {[['0', data.distribution.zero], ['1–2', data.distribution.one_two], ['3–4', data.distribution.three_four], [`${data.settings.starter_daily_limit}+`, data.distribution.at_limit]].map(([label, value]) => <div key={label}><span>{label} research</span><strong>{value}</strong></div>)}
            </div>
            <div className="top-research-list"><strong>Paling banyak dibuka hari ini</strong>{data.top_research.length > 0 ? data.top_research.map((item, index) => <div key={item.id}><b>{index + 1}</b><span>{item.product_name}</span><small>{item.views} pembaca</small></div>) : <p>Belum ada aktiviti untuk hari ini.</p>}</div>
          </article>

          <article className="access-panel access-settings-panel">
            <div className="access-panel-heading"><div><BookOpenCheck /><span><strong>Kesediaan library</strong><small>Sasaran sebelum penguatkuasaan</small></span></div></div>
            <div className="library-readiness"><div><strong>{data.library.published_total}</strong><span>research diterbitkan</span></div><div><strong>+{data.library.published_last_7_days}</strong><span>7 hari terakhir</span></div></div>
            <div className="readiness-track"><span style={{ width: `${progress}%` }} /><small>{progress}% daripada sasaran {data.settings.activation_target}</small></div>
            <div className="quota-settings">
              <label><span>Had harian Starter</span><input type="number" min="1" max="50" value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))} /></label>
              <label><span>Sasaran research</span><input type="number" min="1" max="10000" value={activationTarget} onChange={(event) => setActivationTarget(Number(event.target.value))} /></label>
            </div>
            <div className="enforcement-lock"><LockKeyhole /><div><strong>Penguatkuasaan belum aktif</strong><span>Fasa ini hanya mengukur. Sekatan akan dibuka selepas laluan Research Detail dipagarkan dengan selamat.</span></div></div>
            <button className="button button-primary" type="button" disabled={saving || dailyLimit < 1 || activationTarget < 1} onClick={() => void saveSettings()}>{saving ? <LoaderCircle className="spin" /> : saved ? <Check /> : <Save />}{saved ? 'Tetapan disimpan' : 'Simpan tetapan'}</button>
          </article>
        </div>
      </> : null}
    </section>
  )
}
