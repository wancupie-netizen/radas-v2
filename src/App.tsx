import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminOnlyRoute, AdminRoute, ProtectedRoute } from './auth/RouteGuards'
import { AppShell } from './components/AppShell'
import { AdminStudioPage } from './pages/AdminStudioPage'
import { AdminAnnouncementsPage } from './pages/AdminAnnouncementsPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { AIReviewPage } from './pages/AIReviewPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProPage } from './pages/ProPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResearchDetailPage } from './pages/ResearchDetailPage'
import { ResearchLibraryPage } from './pages/ResearchLibraryPage'
import { SavedResearchPage } from './pages/SavedResearchPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="research" element={<ResearchLibraryPage />} />
        <Route path="saved" element={<SavedResearchPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="pro" element={<ProPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="research/:researchId" element={<ResearchDetailPage />} />
        <Route path="admin" element={<AdminRoute><AdminStudioPage /></AdminRoute>} />
        <Route path="admin/research/:researchId/review" element={<AdminRoute><AIReviewPage /></AdminRoute>} />
        <Route path="admin/announcements" element={<AdminOnlyRoute><AdminAnnouncementsPage /></AdminOnlyRoute>} />
        <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}
