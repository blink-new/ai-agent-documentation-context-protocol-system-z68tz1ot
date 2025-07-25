import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ai-agent-documentation-context-protocol-system-z68tz1ot',
  authRequired: false
});

interface AgentAPIRequest {
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

interface FeedbackRequest {
  agentId: string;
  snippetId: string;
  feedbackType: 'outdated' | 'incorrect' | 'helpful' | 'suggestion';
  feedbackText?: string;
  suggestedImprovement?: string;
  confidenceScore?: number;
}

interface SummaryRequest {
  agentId: string;
  documentId: string;
  chunkSize?: number;
  requestContext?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Set auth token from header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      blink.auth.setToken(token);
    }

    // Route handling
    switch (path) {
      case '/query':
        return await handleQuery(req);
      case '/feedback':
        return await handleFeedback(req);
      case '/summarize':
        return await handleSummarize(req);
      case '/usage-patterns':
        return await handleUsagePatterns(req);
      case '/health':
        return new Response(JSON.stringify({ status: 'healthy', timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

async function handleQuery(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const requestData: AgentAPIRequest = await req.json();
    const startTime = Date.now();

    // Validate required fields
    if (!requestData.agentId || !requestData.query) {
      return new Response(JSON.stringify({ error: 'Missing required fields: agentId, query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Create query record
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = {
      id: queryId,
      agentId: requestData.agentId,
      queryText: requestData.query,
      intent: requestData.intent,
      taskContext: requestData.taskContext,
      queryType: 'context_retrieval',
      timestamp: Date.now(),
      userId: 'system', // System user for API calls
      createdAt: new Date().toISOString()
    };

    await blink.db.agentQueries.create(query);

    // Perform semantic search
    const searchResults = await performSemanticSearch(
      requestData.query,
      requestData.maxResults || 10,
      requestData.minRelevanceScore || 0.7,
      requestData.documentFilters
    );

    // Create context snippets
    const snippets = [];
    for (const result of searchResults) {
      const snippetId = `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const snippet = {
        id: snippetId,
        queryId,
        documentId: result.documentId,
        chunkId: result.chunkId,
        snippetText: result.text,
        relevanceScore: result.relevanceScore,
        startPosition: result.startPosition,
        endPosition: result.endPosition,
        metadata: JSON.stringify(result.metadata),
        userId: 'system',
        createdAt: new Date().toISOString()
      };
      
      await blink.db.contextSnippets.create(snippet);
      snippets.push({
        ...snippet,
        metadata: result.metadata
      });
    }

    const processingTimeMs = Date.now() - startTime;

    // Update query with response time
    await blink.db.agentQueries.update(queryId, {
      responseTimeMs: processingTimeMs,
      relevanceScore: snippets.length > 0 ? snippets[0].relevanceScore : 0
    });

    // Track usage patterns
    await trackUsagePattern(requestData.agentId, 'frequent_query', {
      query: requestData.query,
      intent: requestData.intent,
      resultCount: snippets.length
    });

    const response = {
      queryId,
      snippets,
      totalResults: snippets.length,
      processingTimeMs,
      suggestions: await generateSuggestions(requestData.query),
      relatedQueries: await getRelatedQueries(requestData.agentId)
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Query error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process query', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleFeedback(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const requestData: FeedbackRequest = await req.json();

    // Validate required fields
    if (!requestData.agentId || !requestData.snippetId || !requestData.feedbackType) {
      return new Response(JSON.stringify({ error: 'Missing required fields: agentId, snippetId, feedbackType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const feedback = {
      id: feedbackId,
      agentId: requestData.agentId,
      snippetId: requestData.snippetId,
      feedbackType: requestData.feedbackType,
      feedbackText: requestData.feedbackText,
      confidenceScore: requestData.confidenceScore,
      suggestedImprovement: requestData.suggestedImprovement,
      status: 'pending',
      userId: 'system',
      createdAt: new Date().toISOString()
    };

    await blink.db.agentFeedback.create(feedback);

    // Track feedback pattern
    await trackUsagePattern(requestData.agentId, 'feedback_pattern', {
      feedbackType: requestData.feedbackType,
      snippetId: requestData.snippetId,
      confidence: requestData.confidenceScore
    });

    return new Response(JSON.stringify({ feedbackId, status: 'received' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Feedback error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit feedback', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleSummarize(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const requestData: SummaryRequest = await req.json();

    // Validate required fields
    if (!requestData.agentId || !requestData.documentId) {
      return new Response(JSON.stringify({ error: 'Missing required fields: agentId, documentId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const document = await blink.db.documents.list({
      where: { id: requestData.documentId },
      limit: 1
    });

    if (document.length === 0) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Generate AI summary
    const summaryText = await generateAISummary(document[0].content, requestData.chunkSize);
    
    const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const summary = {
      id: summaryId,
      documentId: requestData.documentId,
      summaryType: 'agent_requested',
      summaryText,
      chunkSize: requestData.chunkSize,
      agentId: requestData.agentId,
      requestContext: requestData.requestContext,
      userId: 'system',
      createdAt: new Date().toISOString()
    };

    await blink.db.documentSummaries.create(summary);

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Summarize error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate summary', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function handleUsagePatterns(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Missing agentId parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const patterns = await blink.db.agentUsagePatterns.list({
      where: { agentId },
      orderBy: { lastOccurrence: 'desc' },
      limit: 100
    });

    return new Response(JSON.stringify({ patterns }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Usage patterns error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get usage patterns', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Helper functions
async function performSemanticSearch(
  query: string,
  maxResults: number,
  minRelevanceScore: number,
  filters?: any
) {
  // Get documents from database
  const documents = await blink.db.documents.list({
    limit: 100,
    orderBy: { createdAt: 'desc' }
  });

  // Simulate semantic search with vector embeddings
  const results = documents
    .map(doc => ({
      documentId: doc.id,
      chunkId: `chunk_${doc.id}_1`,
      text: doc.content.substring(0, 500),
      relevanceScore: Math.random() * 0.3 + 0.7, // Simulate relevance
      startPosition: 0,
      endPosition: 500,
      metadata: {
        title: doc.title,
        category: doc.category,
        tags: doc.tags
      }
    }))
    .filter(result => result.relevanceScore >= minRelevanceScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  return results;
}

async function generateAISummary(content: string, chunkSize?: number): Promise<string> {
  try {
    const { text } = await blink.ai.generateText({
      prompt: `Summarize the following document content in a clear, concise manner. Focus on key points, main concepts, and actionable information that would be useful for AI agents:\n\n${content.substring(0, 4000)}`,
      maxTokens: chunkSize || 500
    });
    return text;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return 'Summary generation failed';
  }
}

async function trackUsagePattern(
  agentId: string,
  patternType: string,
  patternData: any
) {
  try {
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await blink.db.agentUsagePatterns.create({
      id: patternId,
      agentId,
      patternType,
      patternData: JSON.stringify(patternData),
      frequencyCount: 1,
      lastOccurrence: new Date().toISOString(),
      userId: 'system',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking usage pattern:', error);
  }
}

async function generateSuggestions(query: string): Promise<string[]> {
  return [
    `Related to "${query.substring(0, 20)}..."`,
    'Similar documents in this category',
    'Recent updates on this topic',
    'Alternative approaches'
  ];
}

async function getRelatedQueries(agentId: string): Promise<string[]> {
  try {
    const recentQueries = await blink.db.agentQueries.list({
      where: { agentId },
      orderBy: { timestamp: 'desc' },
      limit: 5
    });
    
    return recentQueries.map(q => q.queryText);
  } catch (error) {
    console.error('Error getting related queries:', error);
    return [];
  }
}