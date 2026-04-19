import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { AlertTriangle, TrendingDown, DollarSign, Info } from 'lucide-react'
import api from '../services/api'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Insights() {
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    api.get('/claims/analytics')
      .then((r) => setAnalytics(r.data.analytics))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  const { summary, rejectionReasons, highValueRejected, insuranceStats, monthlyData } = analytics

  // Build monthly chart data
  const monthlyMap = {}
  ;(monthlyData || []).forEach((d) => {
    const key = `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, Approved: 0, Rejected: 0, Pending: 0 }
    monthlyMap[key][d._id.status] = d.count
  })
  const monthlyChart = Object.values(monthlyMap).slice(-6)

  const topReason = rejectionReasons?.[0]?._id || 'N/A'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
        <p className="text-sm text-gray-400 mt-0.5">Analytics derived from your claims data</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          icon={TrendingDown}
          iconClass="bg-red-50 text-red-500"
          label="Rejection Rate"
          value={`${summary.rejectionRate}%`}
          detail={`${summary.rejectedCount} of ${summary.totalClaims} claims rejected`}
        />
        <InsightCard
          icon={AlertTriangle}
          iconClass="bg-amber-50 text-amber-500"
          label="Top Rejection Reason"
          value={topReason}
          detail={`${rejectionReasons?.[0]?.count ?? 0} occurrences`}
          small
        />
        <InsightCard
          icon={DollarSign}
          iconClass="bg-red-50 text-red-500"
          label="High-Value Rejected"
          value={`${highValueRejected?.length ?? 0} claims`}
          detail="Above $500 — needs immediate attention"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Monthly trend */}
        <div className="card px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Monthly Claim Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Approved vs Rejected over time</p>
          {monthlyChart.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyChart} margin={{ left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Approved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Pending"  stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Insurance breakdown */}
        <div className="card px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Claims by Insurer</h3>
          <p className="text-xs text-gray-400 mb-4">Volume per insurance provider</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={insuranceStats} margin={{ left: -16 }}>
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#4f63d2" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-value rejected claims */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-800">High-Value Rejected Claims</h3>
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" /> Amount &gt; $500
          </span>
        </div>
        {highValueRejected?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No high-value rejections 🎉</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {highValueRejected.map((c) => (
              <div key={c._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.patientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.procedure}</p>
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {c.rejectionReason}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-red-600">{fmt(c.amount)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.insurance}</p>
                  <p className="text-xs text-gray-400">{c.assignedTo?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection reasons breakdown */}
      <div className="card px-6 py-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">All Rejection Reasons</h3>
        <div className="space-y-3">
          {(rejectionReasons || []).map((r) => {
            const pct = Math.round((r.count / summary.rejectedCount) * 100)
            return (
              <div key={r._id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{r._id}</span>
                  <span className="text-xs font-medium text-gray-700">{r.count} × ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-red-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InsightCard({ icon: Icon, iconClass, label, value, detail, small }) {
  return (
    <div className="card px-5 py-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-semibold text-gray-900 leading-tight mb-1 ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
      <p className="text-xs text-gray-400">{detail}</p>
    </div>
  )
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-gray-400 text-center py-10">Not enough data yet</p>
}