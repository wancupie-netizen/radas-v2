import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BrandMark } from '../components/BrandMark'

export function RegisterPage() {
  const { session, signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

  if (session) return <Navigate replace to="/" />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Kata laluan mesti mempunyai sekurang-kurangnya 8 aksara.')
      return
    }
    if (password !== confirmPassword) {
      setError('Pengesahan kata laluan tidak sepadan.')
      return
    }

    setSubmitting(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await signUp(fullName.trim(), normalizedEmail, password)
      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(normalizedEmail)
      } else {
        navigate('/', { replace: true })
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Pendaftaran tidak berjaya.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <BrandMark />
        <div>
          <span className="eyebrow">Research Operating System</span>
          <h1>Mulakan research yang lebih tersusun.</h1>
          <p>Daftar sebagai subscriber RADAS untuk menilai produk, menyimpan research dan bergerak daripada data kepada tindakan.</p>
        </div>
        <blockquote>Research, semak, kemudian bertindak.</blockquote>
      </section>

      <section className="login-panel">
        {confirmationEmail ? (
          <div className="login-card registration-success" role="status">
            <div className="login-mobile-brand"><BrandMark /></div>
            <CheckCircle2 size={42} />
            <span className="eyebrow">Pendaftaran diterima</span>
            <h2>Semak email anda</h2>
            <p>Kami telah menghantar pautan pengesahan ke <strong>{confirmationEmail}</strong>. Sahkan email sebelum log masuk ke RADAS.</p>
            <Link className="button button-primary login-submit" to="/login">Ke halaman log masuk <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <form className="login-card" onSubmit={handleSubmit}>
            <div className="login-mobile-brand"><BrandMark /></div>
            <span className="eyebrow">Akaun baharu</span>
            <h2>Daftar ke RADAS</h2>
            <p>Cipta akaun subscriber percuma anda.</p>

            {error ? <div className="login-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div> : null}

            <label className="login-field">
              <span>Nama penuh</span>
              <div><UserRound size={18} /><input autoComplete="name" type="text" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nama anda" /></div>
            </label>
            <label className="login-field">
              <span>Alamat email</span>
              <div><Mail size={18} /><input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></div>
            </label>
            <label className="login-field">
              <span>Kata laluan</span>
              <div><LockKeyhole size={18} /><input autoComplete="new-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 aksara" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            <label className="login-field">
              <span>Sahkan kata laluan</span>
              <div><LockKeyhole size={18} /><input autoComplete="new-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulang kata laluan" /></div>
            </label>

            <button className="button button-primary login-submit" disabled={submitting} type="submit">
              {submitting ? 'Sedang mendaftar...' : 'Daftar akaun'}
              {submitting ? null : <ArrowRight size={18} />}
            </button>
            <p className="auth-switch">Sudah mempunyai akaun? <Link to="/login">Log masuk</Link></p>
            <small>Akaun baharu diberikan akses Subscriber pelan Starter secara automatik.</small>
          </form>
        )}
      </section>
    </main>
  )
}
