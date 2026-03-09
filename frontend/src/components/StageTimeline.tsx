import { Sprout, Leaf, Droplets, Scissors, Sun, Settings2, Package, Clock, MapPin, type LucideIcon } from 'lucide-react'
import type { Event } from '../api/client'

interface StageInfo {
  label: string
  textClass: string
  bgClass: string
  borderClass: string
  Icon: LucideIcon
}

const STAGE: Record<string, StageInfo> = {
  planting:    { label: 'Trồng cây',  textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200', Icon: Sprout    },
  fertilizing: { label: 'Bón phân',   textClass: 'text-lime-700',    bgClass: 'bg-lime-50',    borderClass: 'border-lime-200',    Icon: Leaf      },
  spraying:    { label: 'Phun thuốc', textClass: 'text-blue-700',    bgClass: 'bg-blue-50',    borderClass: 'border-blue-200',    Icon: Droplets  },
  harvesting:  { label: 'Thu hoạch',  textClass: 'text-green-700',   bgClass: 'bg-green-50',   borderClass: 'border-green-200',   Icon: Scissors  },
  drying:      { label: 'Phơi sấy',   textClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-200',   Icon: Sun       },
  processing:  { label: 'Chế biến',   textClass: 'text-orange-700',  bgClass: 'bg-orange-50',  borderClass: 'border-orange-200',  Icon: Settings2 },
  packaging:   { label: 'Đóng gói',   textClass: 'text-teal-700',    bgClass: 'bg-teal-50',    borderClass: 'border-teal-200',    Icon: Package   },
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
    <ol className="relative border-l-2 border-gray-200 space-y-6 pl-6 ml-1">
      {events.map((e, i) => {
        const s = STAGE[e.stage] ?? { label: e.stage, textClass: 'text-gray-700', bgClass: 'bg-gray-50', borderClass: 'border-gray-200', Icon: Package }
        return (
          <li key={e.id} className="relative">
            {/* dot */}
            <span className={`absolute -left-[1.45rem] top-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${s.bgClass} ${s.borderClass}`}>
              <s.Icon className={`w-3 h-3 ${s.textClass}`} />
            </span>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
              {/* stage badge + time */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${s.bgClass} ${s.textClass} ${s.borderClass}`}>
                  <s.Icon className="w-3 h-3" /> {s.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> {fmt(e.timestamp)}
                </span>
                {e.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" /> {e.location}
                  </span>
                )}
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
