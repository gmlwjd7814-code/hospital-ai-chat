'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Message } from '@/types'
import MessageBubble from './MessageBubble'

const QUICK_QUESTIONS = [
  '목이 아프고 열이 나요',
  '오른쪽 아래 배가 찌르듯이 아파요',
  '두통이 심하고 어지러워요',
  '기침이 2주째 계속돼요',
  '피부에 붉은 발진이 생겼어요',
]

export default function ChatInterface() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 세션 생성
  useEffect(() => {
    const init = async () => {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const session = await res.json()
      setSessionId(session.id)
    }
    init()
  }, [])

  // 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId || loading) return

    setError(null)
    setInput('')

    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    // 낙관적 UI: 사용자 메시지 즉시 표시
    const optimisticUserMsg: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUserMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text, history }),
      })

      if (!res.ok) throw new Error('서버 오류가 발생했습니다')

      const data = await res.json()

      // 낙관적 메시지를 실제 메시지로 교체하고 AI 응답 추가
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMsg.id),
        { ...data.userMessage, classification: null },
        data.aiMessage,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [sessionId, messages, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          +
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-none">AI 병원 상담봇</h1>
          <p className="text-xs text-green-500 font-medium mt-0.5">● 온라인</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            참고용 상담 서비스
          </span>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 웰컴 메시지 */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-4xl">
              🏥
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">안녕하세요!</h2>
              <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                증상이나 건강 관련 궁금한 점을<br />편하게 말씀해 주세요.
              </p>
            </div>
            {/* 빠른 질문 버튼 */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-sm">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-sm px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ⚕️ 본 서비스는 의료 참고용이며 전문의 진단을 대체하지 않습니다
            </p>
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-2 mt-1">
              AI
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-full">
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 빠른 질문 (대화 중) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-100 bg-white scrollbar-hide">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 입력창 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="증상이나 궁금한 점을 입력하세요... (Enter로 전송)"
            rows={1}
            disabled={loading || !sessionId}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-gray-50 max-h-32 disabled:opacity-50 leading-relaxed"
            style={{ minHeight: '48px' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !sessionId}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          응급 상황 시 즉시 <strong className="text-red-500">119</strong>에 신고하세요
        </p>
      </div>
    </div>
  )
}
