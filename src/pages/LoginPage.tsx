import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { BrandMark } from '../components/BrandMark'

export function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate replace to="/" />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      const destination = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Log masuk tidak berjaya.')
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
          <h1>Pilih produk dengan lebih yakin.</h1>
          <p>RADAS menukar research kepada keputusan dan tindakan yang lebih jelas untuk affiliate Malaysia.</p>
        </div>
        <blockquote>Research, semak, kemudian bertindak.</blockquote>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-mobile-brand"><BrandMark /></div>
          <span className="eyebrow">Selamat kembali</span>
          <h2>Log masuk ke RADAS</h2>
          <p>Gunakan email dan kata laluan akaun RADAS anda.</p>

          {error ? <div className="login-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div> : null}

          <label className="login-field">
            <span>Alamat email</span>
            <div><Mail size={18} /><input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></div>
          </label>
          <label className="login-field">
            <span>Kata laluan</span>
            <div><LockKeyhole size={18} /><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata laluan" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          </label>

          <button className="button button-primary login-submit" disabled={submitting} type="submit">
            {submitting ? 'Sedang masuk...' : 'Log masuk'}
            {submitting ? null : <ArrowRight size={18} />}
          </button>
          <p className="auth-switch">Belum mempunyai akaun? <Link to="/register">Daftar sekarang</Link></p>
          <small>Akses RADAS dilindungi dan aktiviti akaun tertakluk kepada peranan pengguna.</small>
        </form>
      </section>
    </main>
  )
}
