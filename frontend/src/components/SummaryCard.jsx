export default function SummaryCard({ label, value, sub, icon: Icon, accent = 'blue' }) {
  const accents = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50  text-amber-600',
    red:    'bg-red-50    text-red-600',
  }

  return (
    <div className="card px-5 py-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accents[accent]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  )
}