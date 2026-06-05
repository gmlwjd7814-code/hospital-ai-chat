'use client'

import { Message } from '@/types'
import ClassificationBadge from './ClassificationBadge'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s(.+)$/gm, '<span class="font-bold text-gray-800">$1</span>')
    .replace(/^[-•]\s(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br />')
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* AI 아바타 */}
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold mr-2 mt-1 flex-shrink-0">
          AI
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* 말풍선 */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-pink-500 text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              className="prose prose-sm max-w-none [&_li]:list-disc [&_li]:ml-4"
            />
          )}
        </div>

        {/* 분류 배지 (AI 메시지에만) */}
        {!isUser && message.classification && (
          <div className="w-full">
            <ClassificationBadge c={message.classification} />
          </div>
        )}

        {/* 타임스탬프 */}
        <span className="text-xs text-gray-400 mt-1 px-1">
          {formatTime(message.created_at)}
        </span>
      </div>

      {/* 사용자 아바타 */}
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold ml-2 mt-1 flex-shrink-0">
          나
        </div>
      )}
    </div>
  )
}
