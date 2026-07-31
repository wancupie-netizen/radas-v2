import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AdminStudioPage } from './pages/AdminStudioPage'
import { DashboardPage } from './pages/DashboardPage'
import { ResearchDetailPage } from './pages/ResearchDetailPage'
import { ResearchLibraryPage } from './pages/ResearchLibraryPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="research" element={<ResearchLibraryPage />} />
        <Route path="research/:researchId" element={<ResearchDetailPage />} />
        <Route path="admin" element={<AdminStudioPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}