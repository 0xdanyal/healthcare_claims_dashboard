import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FileText, DollarSign, XCircle, Clock, ArrowRight } from 'lucide-react'
import SummaryCard from '../components/SummaryCard'
import StatusBadge from '../components/StatusBadge'
import api from '../services/api'

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [claims,    setClaims]    = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/claims/analytics'),
      api.get('/claims?limit=5'),
    ]).then(([a, c]) => {
      setAnalytics(a.data.analytics)
      setClaims(c.data.claims)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const { summary, statusStats, rejectionReasons, insuranceStats } = analytics

  const pieData = statusStats.map((s) => ({ name: s._id, value: s.count }))

  const barData = (rejectionReasons || []).map((r) => ({
    name: r._id.length > 28 ? r._id.slice(0, 28) + '…' : r._id,
    count: r.count,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Claims overview and performance metrics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Claims"
          value={summary.totalClaims}
          sub="All statuses"
          icon={FileText}
          accent="blue"
        />
        <SummaryCard
          label="Total Revenue"
          value={fmt(summary.totalRevenue)}
          sub="Approved claims only"
          icon={DollarSign}
          accent="green"
        />
        <SummaryCard
          label="Rejection Rate"
          value={`${summary.rejectionRate}%`}
          sub={`${summary.rejectedCount} rejected`}
          icon={XCircle}
          accent="red"
        />
        <SummaryCard
          label="Pending Review"
          value={summary.pendingCount}
          sub="Awaiting action"
          icon={Clock}
          accent="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Rejection reasons bar */}
        <div className="card px-6 py-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Rejection Reasons</h3>
          {barData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No rejections recorded</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#4f63d2" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="card px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Claims by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
                iconType="circle"
                iconSize={8}
              />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent claims */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Recent Claims</h3>
          <Link to="/claims" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Claim ID', 'Patient', 'Procedure', 'Amount', 'Status', 'Assigned To'].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {claims.map((c) => (
                <tr key={c._id} className="table-row-hover">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{c.claimId}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{c.patientName}</td>
                  <td className="px-6 py-3 text-gray-500 max-w-[180px] truncate">{c.procedure}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{fmt(c.amount)}</td>
                  <td className="px-6 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-6 py-3 text-gray-500">{c.assignedTo?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}