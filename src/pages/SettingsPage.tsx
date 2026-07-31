import { Bell, Database, ShieldCheck, UserRound } from 'lucide-react'

export function SettingsPage() {
  return (
    <>
      <section className="page-heading"><span className="eyebrow">Workspace</span><h1>Tetapan</h1><p>Konfigurasi asas akan diaktifkan apabila Supabase dan authentication disambungkan.</p></section>
      <section className="settings-list">
        <article><span className="settings-icon"><UserRound /></span><div><h2>Profil dan akses</h2><p>Identiti admin, peranan dan akses subscriber.</p></div><button className="button button-secondary" disabled>Akan datang</button></article>
        <article><span className="settings-icon"><Database /></span><div><h2>Sumber data</h2><p>Sambungan Supabase, storage dan polisi keselamatan.</p></div><button className="button button-secondary" disabled>PC-002</button></article>
        <article><span className="settings-icon"><Bell /></span><div><h2>Notifikasi</h2><p>Peringatan semakan research dan status penerbitan.</p></div><button className="button button-secondary" disabled>Akan datang</button></article>
        <article><span className="settings-icon"><ShieldCheck /></span><div><h2>Keselamatan</h2><p>Authentication, RLS dan audit aktiviti admin.</p></div><button className="button button-secondary" disabled>PC-002</button></article>
      </section>
    </>
  )
}