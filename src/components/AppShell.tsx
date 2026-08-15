import { Fragment, useEffect, useState } from 'react'
import { Bookmark, BookOpenText, ChevronRight, LayoutDashboard, LogOut, Megaphone, Menu, Plus, Search, Settings, Sparkles, UserRound, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BrandMark } from './BrandMark'
import { NotificationBell } from './NotificationBell'

const navigation = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard, end: true, staffOnly: false, adminOnly: false, section: 'workspace' },
  { to: '/research', label: 'Research Library', icon: BookOpenText, staffOnly: false, adminOnly: false, section: 'workspace' },
  { to: '/saved', label: 'Research Tersimpan', icon: Bookmark, staffOnly: false, adminOnly: false, section: 'workspace' },
  { to: '/announcements', label: 'Pengumuman', icon: Megaphone, staffOnly: false, adminOnly: false, section: 'workspace' },
  { to: '/profile', label: 'Profil Saya', icon: UserRound, staffOnly: false, adminOnly: false, section: 'workspace' },
  { to: '/admin', label: 'Admin Studio', icon: Sparkles, staffOnly: true, adminOnly: false, section: 'management' },
  { to: '/admin/announcements', label: 'Urus Pengumuman', icon: Megaphone, staffOnly: false, adminOnly: true, section: 'management' },
  { to: '/settings', label: 'Tetapan', icon: Settings, staffOnly: true, adminOnly: false, section: 'management' },
]

const pageNames: Record<string, string> = { '/': 'Ringkasan', '/research': 'Research Library', '/saved': 'Research Tersimpan', '/announcements': 'Pengumuman', '/profile': 'Profil Saya', '/pro': 'RADAS PRO', '/admin': 'Admin Studio', '/admin/announcements': 'Urus Pengumuman', '/settings': 'Tetapan' }

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const location = useLocation()
  const { profile, user, signOut } = useAuth()
  const pageName = location.pathname.includes('/admin/research/') && location.pathname.endsWith('/review')
    ? 'AI Research Review'
    : pageNames[location.pathname] ?? 'Research Detail'
  const isStaff = profile?.role === 'admin' || profile?.role === 'editor'
  const visibleNavigation = navigation.filter((item) => (!item.staffOnly || isStaff) && (!item.adminOnly || profile?.role === 'admin'))
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna RADAS'
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileOpen])

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  return (
    <div className="app-shell">
      <aside id="mobile-navigation" className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head"><BrandMark /><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X size={20} /></button></div>
        <nav className="primary-nav" aria-label="Navigasi utama">
          <p className="nav-label">Workspace</p>
          {visibleNavigation.map(({ to, label, icon: Icon, end, section }, index) => (
            <Fragment key={to}>
              {section === 'management' && visibleNavigation[index - 1]?.section !== 'management' ? <p className="nav-label mobile-management-label">Pengurusan</p> : null}
              <NavLink to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={19} strokeWidth={1.8} /><span>{label}</span><ChevronRight className="nav-chevron" size={16} />
              </NavLink>
            </Fragment>
          ))}
        </nav>
        <div className="sidebar-note"><span className="eyebrow"><Sparkles size={13} /> Prinsip RADAS</span><strong>Pilih dengan yakin.</strong><p>Research yang distruktur untuk membantu affiliate membuat keputusan dan bertindak.</p></div>
        <div className="user-card">
          <div className="avatar">{initials}</div>
          <NavLink className="user-card-profile" to="/profile" onClick={() => setMobileOpen(false)}><strong>{displayName}</strong><span>{profile?.role ?? 'Memuatkan profil'}</span></NavLink>
          <button className="icon-button" disabled={signingOut} onClick={() => void handleSignOut()} aria-label="Log keluar"><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileOpen ? <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" /> : null}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title"><button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Buka menu" aria-controls="mobile-navigation" aria-expanded={mobileOpen}><Menu size={21} /></button><div><span>RADAS Workspace</span><strong>{pageName}</strong></div></div>
          <div className="topbar-actions"><NotificationBell /><label className="global-search"><Search size={17} /><input aria-label="Cari research" placeholder="Cari research..." /><kbd>Ctrl K</kbd></label>{isStaff ? <NavLink className="button button-primary topbar-cta" to="/admin"><Plus size={17} /> Research baharu</NavLink> : null}</div>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  )
}
