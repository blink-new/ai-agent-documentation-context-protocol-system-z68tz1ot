import { blink } from '../blink/client';
import type { 
  AgentQuery, 
  ContextSnippet, 
  AgentFeedback, 
  DocumentSummary,
  AgentAPIRequest,
  AgentAPIResponse,
  ConversationContextLink,
  AgentUsagePattern
} from '../types/agent-interaction';



export class AgentAPIService {
  // Query context programmatically
  static async queryContext(request: AgentAPIRequest): Promise<AgentAPIResponse> {
    const startTime = Date.now();
    
    try {
      // Create query record
      const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = await blink.auth.me();
      
      const query: Omit<AgentQuery, 'id' | 'createdAt'> = {
        id: queryId,
        agentId: request.agentId,
        queryText: request.query,
        intent: request.intent,
        taskContext: request.taskContext,
        queryType: 'context_retrieval',
        timestamp: Date.now(),
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      await blink.db.agentQueries.create(query);

      // Perform semantic search
      const searchResults = await this.performSemanticSearch(
        request.query,
        request.maxResults || 10,
        request.minRelevanceScore || 0.7,
        request.documentFilters
      );

      // Create context snippets
      const snippets: ContextSnippet[] = [];
      for (const result of searchResults) {
        const snippetId = `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const snippet: ContextSnippet = {
          id: snippetId,
          queryId,
          documentId: result.documentId,
          chunkId: result.chunkId,
          snippetText: result.text,
          relevanceScore: result.relevanceScore,
          startPosition: result.startPosition,
          endPosition: result.endPosition,
          metadata: result.metadata,
          userId: user.id,
          createdAt: new Date().toISOString()
        };
        
        await blink.db.contextSnippets.create(snippet);
        snippets.push(snippet);
      }

      const processingTimeMs = Date.now() - startTime;

      // Update query with response time
      await blink.db.agentQueries.update(queryId, {
        responseTimeMs: processingTimeMs,
        relevanceScore: snippets.length > 0 ? snippets[0].relevanceScore : 0
      });

      // Track usage patterns
      await this.trackUsagePattern(request.agentId, 'frequent_query', {
        query: request.query,
        intent: request.intent,
        resultCount: snippets.length
      });

      return {
        queryId,
        snippets,
        totalResults: snippets.length,
        processingTimeMs,
        suggestions: await this.generateSuggestions(request.query),
        relatedQueries: await this.getRelatedQueries(request.agentId)
      };

    } catch (error) {
      console.error('Error querying context:', error);
      throw new Error('Failed to query context');
    }
  }

  // Submit feedback on retrieved content
  static async submitFeedback(
    agentId: string,
    snippetId: string,
    feedbackType: 'outdated' | 'incorrect' | 'helpful' | 'suggestion',
    feedbackText?: string,
    suggestedImprovement?: string,
    confidenceScore?: number
  ): Promise<AgentFeedback> {
    try {
      const user = await blink.auth.me();
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const feedback: AgentFeedback = {
        id: feedbackId,
        agentId,
        snippetId,
        feedbackType,
        feedbackText,
        confidenceScore,
        suggestedImprovement,
        status: 'pending',
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      await blink.db.agentFeedback.create(feedback);

      // Track feedback pattern
      await this.trackUsagePattern(agentId, 'feedback_pattern', {
        feedbackType,
        snippetId,
        confidence: confidenceScore
      });

      return feedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  // Track conversation-to-context linkage
  static async linkConversationContext(
    conversationId: string,
    queryId: string,
    contextSnippetId: string,
    usageType: 'primary' | 'supporting' | 'reference',
    confidenceScore?: number
  ): Promise<ConversationContextLink> {
    try {
      const user = await blink.auth.me();
      const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const link: ConversationContextLink = {
        id: linkId,
        conversationId,
        queryId,
        contextSnippetId,
        usageType,
        confidenceScore,
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      await blink.db.conversationContextLinks.create(link);
      return link;
    } catch (error) {
      console.error('Error linking conversation context:', error);
      throw new Error('Failed to link conversation context');
    }
  }

  // Auto-summarize and re-chunk documents
  static async summarizeDocument(
    documentId: string,
    agentId: string,
    chunkSize?: number,
    requestContext?: string
  ): Promise<DocumentSummary> {
    try {
      const user = await blink.auth.me();
      const document = await blink.db.documents.list({
        where: { id: documentId },
        limit: 1
      });

      if (document.length === 0) {
        throw new Error('Document not found');
      }

      // Generate AI summary
      const summaryText = await this.generateAISummary(document[0].content, chunkSize);
      
      const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const summary: DocumentSummary = {
        id: summaryId,
        documentId,
        summaryType: 'agent_requested',
        summaryText,
        chunkSize,
        agentId,
        requestContext,
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      await blink.db.documentSummaries.create(summary);

      // Re-chunk if requested
      if (chunkSize) {
        await this.rechunkDocument(documentId, chunkSize);
      }

      return summary;
    } catch (error) {
      console.error('Error summarizing document:', error);
      throw new Error('Failed to summarize document');
    }
  }

  // Get agent usage patterns
  static async getUsagePatterns(agentId: string): Promise<AgentUsagePattern[]> {
    try {
      return await blink.db.agentUsagePatterns.list({
        where: { agentId },
        orderBy: { lastOccurrence: 'desc' },
        limit: 100
      });
    } catch (error) {
      console.error('Error getting usage patterns:', error);
      throw new Error('Failed to get usage patterns');
    }
  }

  // Private helper methods
  private static async performSemanticSearch(
    query: string,
    maxResults: number,
    minRelevanceScore: number,
    filters?: any
  ) {
    // Simulate semantic search with vector embeddings
    const documents = await blink.db.documents.list({
      limit: 100,
      orderBy: { createdAt: 'desc' }
    });

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

  private static async generateAISummary(content: string, chunkSize?: number): Promise<string> {
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

  private static async rechunkDocument(documentId: string, chunkSize: number) {
    try {
      const document = await blink.db.documents.list({
        where: { id: documentId },
        limit: 1
      });

      if (document.length === 0) return;

      const content = document[0].content;
      const chunks = this.chunkText(content, chunkSize);
      const user = await blink.auth.me();

      // Delete existing chunks
      const existingChunks = await blink.db.documentChunks.list({
        where: { documentId }
      });
      
      for (const chunk of existingChunks) {
        await blink.db.documentChunks.delete(chunk.id);
      }

      // Create new chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `chunk_${documentId}_${i + 1}`;
        await blink.db.documentChunks.create({
          id: chunkId,
          documentId,
          chunkIndex: i,
          content: chunks[i],
          startPosition: i * chunkSize,
          endPosition: Math.min((i + 1) * chunkSize, content.length),
          embedding: JSON.stringify(Array(384).fill(0).map(() => Math.random())), // Mock embedding
          userId: user.id,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error rechunking document:', error);
    }
  }

  private static chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  private static async trackUsagePattern(
    agentId: string,
    patternType: string,
    patternData: any
  ) {
    try {
      const user = await blink.auth.me();
      const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await blink.db.agentUsagePatterns.create({
        id: patternId,
        agentId,
        patternType,
        patternData: JSON.stringify(patternData),
        frequencyCount: 1,
        lastOccurrence: new Date().toISOString(),
        userId: user.id,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking usage pattern:', error);
    }
  }

  private static async generateSuggestions(query: string): Promise<string[]> {
    // Generate query suggestions based on the current query
    return [
      `Related to "${query.substring(0, 20)}..."`,
      'Similar documents in this category',
      'Recent updates on this topic',
      'Alternative approaches'
    ];
  }

  private static async getRelatedQueries(agentId: string): Promise<string[]> {
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
}