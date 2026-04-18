const config = {
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending:  'bg-amber-50  text-amber-700  border-amber-200',
  Rejected: 'bg-red-50    text-red-700    border-red-200',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'Approved' ? 'bg-emerald-500' :
        status === 'Pending'  ? 'bg-amber-500'   :
        status === 'Rejected' ? 'bg-red-500'     : 'bg-gray-400'
      }`} />
      {status}
    </span>
  )
}