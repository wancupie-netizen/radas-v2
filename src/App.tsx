import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute, ProtectedRoute } from './auth/RouteGuards'
import { AppShell } from './components/AppShell'
import { AdminStudioPage } from './pages/AdminStudioPage'
import { AIReviewPage } from './pages/AIReviewPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ResearchDetailPage } from './pages/ResearchDetailPage'
import { ResearchLibraryPage } from './pages/ResearchLibraryPage'
import { SavedResearchPage } from './pages/SavedResearchPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="research" element={<ResearchLibraryPage />} />
        <Route path="saved" element={<SavedResearchPage />} />
        <Route path="research/:researchId" element={<ResearchDetailPage />} />
        <Route path="admin" element={<AdminRoute><AdminStudioPage /></AdminRoute>} />
        <Route path="admin/research/:researchId/review" element={<AdminRoute><AIReviewPage /></AdminRoute>} />
        <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}