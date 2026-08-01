import { useState } from 'react'
import { Bookmark, BookOpenText, ChevronRight, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BrandMark } from './BrandMark'

const navigation = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard, end: true, staffOnly: false },
  { to: '/research', label: 'Research Library', icon: BookOpenText, staffOnly: false },
  { to: '/saved', label: 'Research Tersimpan', icon: Bookmark, staffOnly: false },
  { to: '/admin', label: 'Admin Studio', icon: Sparkles, staffOnly: true },
  { to: '/settings', label: 'Tetapan', icon: Settings, staffOnly: true },
]

const pageNames: Record<string, string> = { '/': 'Ringkasan', '/research': 'Research Library', '/saved': 'Research Tersimpan', '/admin': 'Admin Studio', '/settings': 'Tetapan' }

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const location = useLocation()
  const { profile, user, signOut } = useAuth()
  const pageName = location.pathname.includes('/admin/research/') && location.pathname.endsWith('/review')
    ? 'AI Research Review'
    : pageNames[location.pathname] ?? 'Research Detail'
  const isStaff = profile?.role === 'admin' || profile?.role === 'editor'
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna RADAS'
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head"><BrandMark /><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X size={20} /></button></div>
        <nav className="primary-nav" aria-label="Navigasi utama">
          <p className="nav-label">Workspace</p>
          {navigation.filter((item) => !item.staffOnly || isStaff).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span><ChevronRight className="nav-chevron" size={16} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note"><span className="eyebrow"><Sparkles size={13} /> Prinsip RADAS</span><strong>Pilih dengan yakin.</strong><p>Research yang distruktur untuk membantu affiliate membuat keputusan dan bertindak.</p></div>
        <div className="user-card">
          <div className="avatar">{initials}</div>
          <div><strong>{displayName}</strong><span>{profile?.role ?? 'Memuatkan profil'}</span></div>
          <button className="icon-button" disabled={signingOut} onClick={() => void handleSignOut()} aria-label="Log keluar"><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileOpen ? <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" /> : null}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title"><button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Menu size={21} /></button><div><span>RADAS Workspace</span><strong>{pageName}</strong></div></div>
          <div className="topbar-actions"><label className="global-search"><Search size={17} /><input aria-label="Cari research" placeholder="Cari research..." /><kbd>Ctrl K</kbd></label>{isStaff ? <NavLink className="button button-primary topbar-cta" to="/admin"><Plus size={17} /> Research baharu</NavLink> : null}</div>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  )
}