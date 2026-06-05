export type MessageRole = 'user' | 'assistant'

export interface Classification {
  intent: 'symptom_inquiry' | 'hospital_info' | 'appointment' | 'emergency' | 'general'
  symptoms: string[]
  suspected_conditions: string[]
  recommended_department: string
  is_emergency: boolean
  urgency_level: 'emergency' | 'high' | 'medium' | 'low'
  reasoning: string
}

export interface Message {
  id: string
  session_id: string
  role: MessageRole
  content: string
  classification?: Classification | null
  created_at: string
}

export interface Session {
  id: string
  created_at: string
  updated_at: string
}

export interface ChatRequest {
  session_id: string
  message: string
  history: { role: MessageRole; content: string }[]
}

export interface ChatResponse {
  message: Message
  classification?: Classification | null
}
