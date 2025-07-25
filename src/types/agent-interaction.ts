// AI Agent Interaction Types

export interface AgentQuery {
  id: string;
  agentId: string;
  queryText: string;
  intent?: string;
  taskContext?: string;
  queryType: 'context_retrieval' | 'summarization' | 'feedback' | 'analysis';
  timestamp: number;
  responseTimeMs?: number;
  relevanceScore?: number;
  userId: string;
  createdAt: string;
}

export interface ContextSnippet {
  id: string;
  queryId: string;
  documentId: string;
  chunkId?: string;
  snippetText: string;
  relevanceScore: number;
  startPosition?: number;
  endPosition?: number;
  metadata?: Record<string, any>;
  userId: string;
  createdAt: string;
}

export interface AgentFeedback {
  id: string;
  agentId: string;
  snippetId: string;
  feedbackType: 'outdated' | 'incorrect' | 'helpful' | 'suggestion';
  feedbackText?: string;
  confidenceScore?: number;
  suggestedImprovement?: string;
  status: 'pending' | 'reviewed' | 'implemented';
  userId: string;
  createdAt: string;
}

export interface ConversationContextLink {
  id: string;
  conversationId: string;
  queryId: string;
  contextSnippetId: string;
  usageType: 'primary' | 'supporting' | 'reference';
  confidenceScore?: number;
  userId: string;
  createdAt: string;
}

export interface DocumentSummary {
  id: string;
  documentId: string;
  summaryType: 'auto' | 'agent_requested' | 'manual';
  summaryText: string;
  chunkSize?: number;
  agentId?: string;
  requestContext?: string;
  userId: string;
  createdAt: string;
}

export interface AgentUsagePattern {
  id: string;
  agentId: string;
  patternType: 'frequent_query' | 'document_preference' | 'time_pattern';
  patternData: Record<string, any>;
  frequencyCount: number;
  lastOccurrence: string;
  userId: string;
  createdAt: string;
}

export interface PluginIntegration {
  id: string;
  pluginType: 'langchain' | 'openai_function' | 'custom';
  pluginName: string;
  configuration: Record<string, any>;
  isActive: boolean;
  agentId?: string;
  userId: string;
  createdAt: string;
}

export interface AgentAPIRequest {
  agentId: string;
  query: string;
  intent?: string;
  taskContext?: string;
  maxResults?: number;
  minRelevanceScore?: number;
  documentFilters?: {
    categories?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface AgentAPIResponse {
  queryId: string;
  snippets: ContextSnippet[];
  totalResults: number;
  processingTimeMs: number;
  suggestions?: string[];
  relatedQueries?: string[];
}

export interface WebSocketMessage {
  type: 'query' | 'feedback' | 'summary_request' | 'status_update';
  payload: any;
  timestamp: number;
  agentId: string;
}

export interface PluginFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface LangChainTool {
  name: string;
  description: string;
  func: (input: string) => Promise<string>;
  returnDirect?: boolean;
}