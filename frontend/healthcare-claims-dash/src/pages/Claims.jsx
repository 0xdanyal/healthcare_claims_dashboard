import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, ChevronDown } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STATUSES   = ['All', 'Pending', 'Approved', 'Rejected']
const INSURERS   = ['All', 'BlueCross BlueShield', 'Aetna', 'UnitedHealthcare', 'Medicare', 'Cigna', 'Humana']
const PRIORITIES = { High: 'text-red-600', Medium: 'text-amber-600', Low: 'text-gray-400' }

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function Claims() {
  const { isAdmin }        = useAuth()
  const [claims,  setClaims]   = useState([])
  const [loading, setLoading]  = useState(true)
  const [total,   setTotal]    = useState(0)

  // Filters
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('All')
  const [insurance, setInsurance] = useState('All')

  // Resubmit state
  const [resubmitting, setResubmitting] = useState(null)

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)              params.set('search', search)
      if (status !== 'All')    params.set('status', status)
      if (insurance !== 'All') params.set('insurance', insurance)

      const res = await api.get(`/claims?${params}`)
      setClaims(res.data.claims)
      setTotal(res.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, status, insurance])

  useEffect(() => {
    const t = setTimeout(fetchClaims, 300) // debounce search
    return () => clearTimeout(t)
  }, [fetchClaims])

  const handleResubmit = async (id) => {
    setResubmitting(id)
    try {
      const res = await api.patch(`/claims/${id}/resubmit`)
      setClaims((prev) => prev.map((c) => c._id === id ? res.data.claim : c))
    } catch (err) {
      alert(err.response?.data?.message || 'Resubmit failed')
    } finally {
      setResubmitting(null)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Claims</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} claim{total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card px-5 py-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient, claim ID, procedure…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer min-w-[130px]"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Insurance filter */}
          <div className="relative">
            <select
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer min-w-[170px]"
            >
              {INSURERS.map((i) => <option key={i}>{i}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Claim ID', 'Patient', 'Procedure', 'Insurance', 'Amount', 'Priority', 'Status', 'Assigned To', 'Date', ...(isAdmin ? ['Action'] : [])].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      Loading claims…
                    </div>
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400 text-sm">
                    No claims found
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c._id} className="table-row-hover">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 whitespace-nowrap">{c.claimId}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800 whitespace-nowrap">{c.patientName}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[180px]">
                      <span className="truncate block">{c.procedure}</span>
                      {c.procedureCode && (
                        <span className="text-xs font-mono text-gray-400">{c.procedureCode}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{c.insurance}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{fmt(c.amount)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-medium ${PRIORITIES[c.priority]}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <StatusBadge status={c.status} />
                        {c.status === 'Rejected' && c.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[160px] leading-tight">
                            {c.rejectionReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{c.assignedTo?.name}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {c.status === 'Rejected' ? (
                          <button
                            onClick={() => handleResubmit(c._id)}
                            disabled={resubmitting === c._id}
                            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${resubmitting === c._id ? 'animate-spin' : ''}`} />
                            Fix & Resubmit
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!loading && claims.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-xs text-gray-400">Showing {claims.length} of {total} claims</p>
          </div>
        )}
      </div>
    </div>
  )
}