import { AlertCircle, CalendarDays, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { updateOwnPassword, updateOwnProfile } from '../lib/profile'

type Message = { type: 'success' | 'error'; text: string }

const roleLabels = { admin: 'Admin', editor: 'Editor', subscriber: 'Subscriber' }
const planLabels = { free: 'Free', pro: 'Pro' }

export function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [profileMessage, setProfileMessage] = useState<Message | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => setFullName(profile?.full_name ?? ''), [profile?.full_name])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = fullName.trim()
    setProfileMessage(null)
    if (!user || normalizedName.length < 2) {
      setProfileMessage({ type: 'error', text: 'Nama penuh mesti mempunyai sekurang-kurangnya 2 aksara.' })
      return
    }

    setSavingProfile(true)
    try {
      await updateOwnProfile(user.id, normalizedName)
      await refreshProfile()
      setProfileMessage({ type: 'success', text: 'Profil berjaya dikemas kini.' })
    } catch (caught) {
      setProfileMessage({ type: 'error', text: caught instanceof Error ? caught.message : 'Profil tidak dapat dikemas kini.' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordMessage(null)
    if (password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Kata laluan mesti mempunyai sekurang-kurangnya 8 aksara.' })
      return
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Pengesahan kata laluan tidak sepadan.' })
      return
    }

    setSavingPassword(true)
    try {
      await updateOwnPassword(password)
      setPassword('')
      setConfirmPassword('')
      setPasswordMessage({ type: 'success', text: 'Kata laluan berjaya ditukar.' })
    } catch (caught) {
      setPasswordMessage({ type: 'error', text: caught instanceof Error ? caught.message : 'Kata laluan tidak dapat ditukar.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const joinedAt = profile?.created_at
    ? new Intl.DateTimeFormat('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.created_at))
    : '—'

  return (
    <>
      <section className="page-heading"><span className="eyebrow">Akaun RADAS</span><h1>Profil Saya</h1><p>Urus identiti dan keselamatan akaun anda.</p></section>
      <div className="profile-layout">
        <section className="profile-panel">
          <div className="profile-panel-heading"><span className="settings-icon"><UserRound /></span><div><h2>Maklumat profil</h2><p>Nama ini digunakan pada seluruh workspace RADAS.</p></div></div>
          {profileMessage ? <div className={`studio-message ${profileMessage.type}`} role="status">{profileMessage.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}<span>{profileMessage.text}</span></div> : null}
          <form onSubmit={handleProfileSubmit}>
            <label className="profile-field"><span>Nama penuh</span><div><UserRound /><input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} /></div></label>
            <label className="profile-field readonly"><span>Alamat email</span><div><Mail /><input readOnly value={user?.email ?? ''} /></div></label>
            <button className="button button-primary profile-submit" disabled={savingProfile || fullName.trim() === profile?.full_name} type="submit"><Save />{savingProfile ? 'Sedang menyimpan...' : 'Simpan perubahan'}</button>
          </form>
        </section>

        <aside className="profile-summary">
          <h2>Butiran akaun</h2>
          <div><ShieldCheck /><span>Peranan<small>{profile ? roleLabels[profile.role] : '—'}</small></span></div>
          <div><KeyRound /><span>Pelan<small>{profile ? planLabels[profile.plan] : '—'}</small></span></div>
          <div><CalendarDays /><span>Tarikh menyertai<small>{joinedAt}</small></span></div>
          <p>Peranan dan pelan diurus oleh pentadbir RADAS.</p>
        </aside>

        <section className="profile-panel password-panel">
          <div className="profile-panel-heading"><span className="settings-icon"><LockKeyhole /></span><div><h2>Tukar kata laluan</h2><p>Gunakan sekurang-kurangnya 8 aksara.</p></div></div>
          {passwordMessage ? <div className={`studio-message ${passwordMessage.type}`} role="status">{passwordMessage.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}<span>{passwordMessage.text}</span></div> : null}
          <form onSubmit={handlePasswordSubmit}>
            <label className="profile-field"><span>Kata laluan baharu</span><div><LockKeyhole /><input autoComplete="new-password" required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            <label className="profile-field"><span>Sahkan kata laluan</span><div><LockKeyhole /><input autoComplete="new-password" required minLength={8} type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></label>
            <button className="button button-secondary profile-submit" disabled={savingPassword} type="submit"><KeyRound />{savingPassword ? 'Sedang menukar...' : 'Tukar kata laluan'}</button>
          </form>
        </section>
      </div>
    </>
  )
}
