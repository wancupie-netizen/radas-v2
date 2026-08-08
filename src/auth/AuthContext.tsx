import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (fullName: string, email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<ProfileRow> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data as ProfileRow
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      setProfileError(null)
      setProfile(await fetchProfile(userId))
    } catch (error) {
      setProfile(null)
      setProfileError(error instanceof Error ? error.message : 'Profil tidak dapat dimuatkan.')
    }
  }, [])

  useEffect(() => {
    let active = true

    async function initializeAuth() {
      if (!supabase) {
        if (active) setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      if (active) setLoading(false)
    }

    void initializeAuth()

    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (nextSession?.user) {
        setLoading(true)
        void loadProfile(nextSession.user.id).finally(() => {
          if (active) setLoading(false)
        })
      } else {
        setProfile(null)
        setProfileError(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription?.data.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi. Semak fail .env.local.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi. Semak fail .env.local.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
    return { requiresEmailConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [loadProfile, session?.user])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileError,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [session, profile, loading, profileError, signIn, signUp, signOut, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
