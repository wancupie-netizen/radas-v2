import { useState } from 'react'
import {
  BookOpenText,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from './BrandMark'

const navigation = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/research', label: 'Research Library', icon: BookOpenText },
  { to: '/admin', label: 'Admin Studio', icon: Sparkles },
  { to: '/settings', label: 'Tetapan', icon: Settings },
]

const pageNames: Record<string, string> = {
  '/': 'Ringkasan',
  '/research': 'Research Library',
  '/admin': 'Admin Studio',
  '/settings': 'Tetapan',
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const pageName = pageNames[location.pathname] ?? 'Research Detail'

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <BrandMark />
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        <nav className="primary-nav" aria-label="Navigasi utama">
          <p className="nav-label">Workspace</p>
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              <ChevronRight className="nav-chevron" size={16} />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="eyebrow"><Sparkles size={13} /> Prinsip RADAS</span>
          <strong>Pilih dengan yakin.</strong>
          <p>Research yang distruktur untuk membantu affiliate membuat keputusan dan bertindak.</p>
        </div>

        <div className="user-card">
          <div className="avatar">AD</div>
          <div><strong>Admin RADAS</strong><span>Owner workspace</span></div>
          <button className="icon-button" aria-label="Tetapan akaun"><Settings size={17} /></button>
        </div>
      </aside>

      {mobileOpen ? <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" /> : null}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
              <Menu size={21} />
            </button>
            <div><span>RADAS Workspace</span><strong>{pageName}</strong></div>
          </div>
          <div className="topbar-actions">
            <label className="global-search">
              <Search size={17} />
              <input aria-label="Cari research" placeholder="Cari research..." />
              <kbd>Ctrl K</kbd>
            </label>
            <NavLink className="button button-primary topbar-cta" to="/admin">
              <Plus size={17} /> Research baharu
            </NavLink>
          </div>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  )
}