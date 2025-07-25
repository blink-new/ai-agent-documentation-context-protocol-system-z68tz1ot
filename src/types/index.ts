export interface Document {
  id: string
  title: string
  content: string
  format: 'markdown' | 'pdf' | 'html' | 'json'
  file_url?: string
  file_size?: number
  tags: string[]
  category: string
  subcategory?: string
  version: number
  status: 'active' | 'archived' | 'draft'
  embedding_vector?: number[]
  relevance_score: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  name: string
  description?: string
  api_key: string
  permissions: string[]
  access_level: 'read' | 'write' | 'admin'
  allowed_categories: string[]
  rate_limit: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface DocumentAccessLog {
  id: string
  document_id: string
  agent_id?: string
  access_type: 'view' | 'search' | 'api_request'
  query_text?: string
  relevance_score?: number
  user_id: string
  created_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  content: string
  changes_summary?: string
  user_id: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  parent_id?: string
  description?: string
  color: string
  user_id: string
  created_at: string
}

export interface SearchResult {
  document: Document
  relevance_score: number
  matched_content: string
}

export interface AnalyticsData {
  total_documents: number
  total_agents: number
  total_searches: number
  popular_categories: Array<{ category: string; count: number }>
  recent_activity: DocumentAccessLog[]
}