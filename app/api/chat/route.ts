import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MEDICAL_SYSTEM_PROMPT } from '@/lib/system-prompt'
import { Classification } from '@/types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  const { session_id, message, history } = await req.json()

  if (!session_id || !message) {
    return NextResponse.json({ error: 'session_id와 message는 필수입니다' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API 키가 설정되지 않았습니다' }, { status: 500 })
  }

  // 사용자 메시지 저장
  const { data: userMsg, error: userMsgError } = await supabase
    .from('consultation_messages')
    .insert({ session_id, role: 'user', content: message })
    .select()
    .single()

  if (userMsgError) {
    return NextResponse.json({ error: userMsgError.message }, { status: 500 })
  }

  // OpenRouter 호출
  const messages = [
    ...(history || []).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  let aiContent = ''
  let classification: Classification | null = null

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Hospital AI Consultation',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'system', content: MEDICAL_SYSTEM_PROMPT }, ...messages],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenRouter 오류: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ''

    const parsed = JSON.parse(rawContent)
    aiContent = parsed.message || rawContent
    classification = parsed.classification || null
  } catch (err) {
    console.error('LLM 호출 오류:', err)
    aiContent =
      '죄송합니다. 현재 AI 상담 서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주시거나, 긴급한 경우 119에 연락하시기 바랍니다.'
  }

  // AI 응답 저장
  const { data: aiMsg, error: aiMsgError } = await supabase
    .from('consultation_messages')
    .insert({
      session_id,
      role: 'assistant',
      content: aiContent,
      classification,
    })
    .select()
    .single()

  if (aiMsgError) {
    return NextResponse.json({ error: aiMsgError.message }, { status: 500 })
  }

  // 세션 updated_at 갱신
  await supabase
    .from('consultation_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', session_id)

  return NextResponse.json({
    userMessage: userMsg,
    aiMessage: aiMsg,
    classification,
  })
}
