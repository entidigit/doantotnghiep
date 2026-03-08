import type { Event } from '../api/client'

interface StageInfo {
  label: string
  color: string
  bg: string
  emoji: string
}

const STAGE: Record<string, StageInfo> = {
  planting:    { label: 'Trồng cây',   color: 'text-lime-700',   bg: 'bg-lime-500',    emoji: '🌱' },
  fertilizing: { label: 'Bón phân',    color: 'text-yellow-700', bg: 'bg-yellow-500',  emoji: '🌿' },
  spraying:    { label: 'Phun thuốc',  color: 'text-orange-700', bg: 'bg-orange-400',  emoji: '💧' },
  harvesting:  { label: 'Thu hoạch',   color: 'text-green-700',  bg: 'bg-green-600',   emoji: '🍃' },
  drying:      { label: 'Phơi sấy',    color: 'text-amber-700',  bg: 'bg-amber-500',   emoji: '☀️' },
  processing:  { label: 'Chế biến',    color: 'text-teal-700',   bg: 'bg-teal-500',    emoji: '⚙️' },
  packaging:   { label: 'Đóng gói',    color: 'text-tea-700',    bg: 'bg-tea-700',     emoji: '📦' },
}

function fmt(ts: string) {
  return new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function StageTimeline({ events }: { events: Event[] }) {
  if (events.length === 0)
    return <p className="text-gray-400 text-sm italic py-4">Chưa có sự kiện nào.</p>

  return (
    <ol className="relative border-l-2 border-tea-200 space-y-8 pl-6 ml-1">
      {events.map((e, i) => {
        const s = STAGE[e.stage] ?? { label: e.stage, color: 'text-gray-700', bg: 'bg-gray-400', emoji: '📋' }
        return (
          <li key={e.id} className="relative">
            {/* dot */}
            <span className={`absolute -left-[1.45rem] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${s.bg}`}>
              {i + 1}
            </span>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
              {/* stage badge + time */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${s.bg}`}>
                  {s.emoji} {s.label}
                </span>
                <span className="text-xs text-gray-400">🕐 {fmt(e.timestamp)}</span>
                {e.location && <span className="text-xs text-gray-400">📍 {e.location}</span>}
              </div>

              {/* description */}
              <p className="text-sm text-gray-700 leading-relaxed">{e.description}</p>

              {/* images */}
              {e.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {e.images.map((src) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={src}
                        alt="event"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:scale-105 transition shadow-sm"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* blockchain proof collapsible */}
              <details className="mt-3 group">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 list-none flex items-center gap-1">
                  <span className="group-open:hidden">▶</span>
                  <span className="hidden group-open:inline">▼</span>
                  Blockchain proof
                </summary>
                <div className="mt-1 text-xs font-mono break-all text-gray-500 bg-gray-50 border rounded-lg p-2.5 space-y-1">
                  <div><span className="font-semibold text-gray-600">EventHash:</span> {e.eventHash}</div>
                  <div><span className="font-semibold text-gray-600">TxHash:</span> {e.txHash}</div>
                </div>
              </details>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
