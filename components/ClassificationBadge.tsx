'use client'

import { Classification } from '@/types'

const urgencyConfig = {
  emergency: { label: '응급', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  high:      { label: '빠른 진료 필요', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  medium:    { label: '진료 권장', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  low:       { label: '일반 진료', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
}

export default function ClassificationBadge({ c }: { c: Classification }) {
  const cfg = urgencyConfig[c.urgency_level] || urgencyConfig.low

  return (
    <div className={`mt-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3 text-sm space-y-2`}>
      {/* 응급 배너 */}
      {c.is_emergency && (
        <div className="flex items-center gap-2 font-bold text-red-700 text-base">
          <span className="text-xl">🚨</span>
          <span>응급 상황 — 지금 즉시 119 또는 응급실로 이동하세요</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {/* 긴급도 */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        {/* 추천 진료과 */}
        {c.recommended_department && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-semibold">
            🏥 {c.recommended_department}
          </span>
        )}
      </div>

      {/* 증상 태그 */}
      {c.symptoms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-gray-500 font-medium">증상:</span>
          {c.symptoms.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* 의심 질환 */}
      {c.suspected_conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-gray-500 font-medium">의심 질환:</span>
          {c.suspected_conditions.map((d) => (
            <span key={d} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
