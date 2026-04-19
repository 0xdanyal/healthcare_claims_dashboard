import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react'

const DEMO_CREDS = [
  { label: 'Admin',        email: 'admin@claimsdash.com', password: 'Admin@1234', role: 'Full access' },
  { label: 'Staff – James', email: 'james@claimsdash.com', password: 'Staff@1234', role: 'Limited access' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (cred) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">ClaimsPro</span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
            Healthcare Claims<br />Management System
          </h1>
          <p className="text-brand-200 text-sm leading-relaxed max-w-sm">
            Track, manage, and resolve medical claims with real-time insights into rejection patterns and revenue recovery.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Claims Processed', value: '20+' },
              { label: 'Avg Resolution', value: '2.4 days' },
              { label: 'Recovery Rate', value: '94%' },
              { label: 'Insurers Supported', value: '6' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3">
                <p className="text-white font-semibold text-lg">{s.value}</p>
                <p className="text-brand-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-brand-300 text-xs">© 2024 ClaimsPro. Built for healthcare billing teams.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">ClaimsPro</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 mb-8">Enter your credentials to continue</p>

          {/* Demo quick-fill */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2 font-medium">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDS.map((c) => (
                <button
                  key={c.email}
                  onClick={() => fillDemo(c)}
                  type="button"
                  className="text-left border border-gray-200 rounded-lg px-3 py-2.5 hover:border-brand-400 hover:bg-brand-50 transition-colors duration-150"
                >
                  <p className="text-xs font-medium text-gray-800">{c.label}</p>
                  <p className="text-xs text-gray-400">{c.role}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#f5f6fa] px-3 text-xs text-gray-400">or sign in manually</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@claimsdash.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}