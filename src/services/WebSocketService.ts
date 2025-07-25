import { blink } from '../blink/client';
import type { WebSocketMessage } from '../types/agent-interaction';
import { AgentAPIService } from './AgentAPIService';



export class WebSocketService {
  private static channels = new Map<string, any>();
  private static messageHandlers = new Map<string, (message: WebSocketMessage) => void>();

  // Initialize WebSocket connection for an agent
  static async initializeAgentConnection(agentId: string): Promise<void> {
    try {
      const channelName = `agent-${agentId}`;
      
      if (this.channels.has(channelName)) {
        return; // Already connected
      }

      const channel = blink.realtime.channel(channelName);
      
      await channel.subscribe({
        userId: agentId,
        metadata: {
          type: 'ai_agent',
          capabilities: ['query', 'feedback', 'summarization'],
          status: 'online'
        }
      });

      // Listen for incoming messages
      const unsubscribe = channel.onMessage(async (message) => {
        await this.handleIncomingMessage(agentId, message);
      });

      this.channels.set(channelName, { channel, unsubscribe });
      
      console.log(`WebSocket connection initialized for agent: ${agentId}`);
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
      throw new Error('Failed to initialize WebSocket connection');
    }
  }

  // Send message to agent
  static async sendToAgent(agentId: string, message: WebSocketMessage): Promise<void> {
    try {
      const channelName = `agent-${agentId}`;
      const channelData = this.channels.get(channelName);
      
      if (!channelData) {
        await this.initializeAgentConnection(agentId);
        return this.sendToAgent(agentId, message);
      }

      await channelData.channel.publish('agent_message', message, {
        userId: agentId,
        metadata: { timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Error sending message to agent:', error);
      throw new Error('Failed to send message to agent');
    }
  }

  // Broadcast to all connected agents
  static async broadcastToAllAgents(message: WebSocketMessage): Promise<void> {
    try {
      const promises = Array.from(this.channels.keys()).map(channelName => {
        const agentId = channelName.replace('agent-', '');
        return this.sendToAgent(agentId, message);
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error broadcasting to agents:', error);
      throw new Error('Failed to broadcast to agents');
    }
  }

  // Handle incoming messages from agents
  private static async handleIncomingMessage(agentId: string, message: any): Promise<void> {
    try {
      const wsMessage: WebSocketMessage = {
        type: message.type,
        payload: message.data,
        timestamp: message.timestamp || Date.now(),
        agentId
      };

      switch (wsMessage.type) {
        case 'query':
          await this.handleQueryMessage(wsMessage);
          break;
        case 'feedback':
          await this.handleFeedbackMessage(wsMessage);
          break;
        case 'summary_request':
          await this.handleSummaryRequest(wsMessage);
          break;
        case 'status_update':
          await this.handleStatusUpdate(wsMessage);
          break;
        default:
          console.warn(`Unknown message type: ${wsMessage.type}`);
      }

      // Call registered message handlers
      const handler = this.messageHandlers.get(agentId);
      if (handler) {
        handler(wsMessage);
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Handle query messages
  private static async handleQueryMessage(message: WebSocketMessage): Promise<void> {
    try {
      const { query, intent, taskContext, maxResults, minRelevanceScore } = message.payload;
      
      const response = await AgentAPIService.queryContext({
        agentId: message.agentId,
        query,
        intent,
        taskContext,
        maxResults,
        minRelevanceScore
      });

      // Send response back to agent
      await this.sendToAgent(message.agentId, {
        type: 'query',
        payload: {
          type: 'response',
          queryId: response.queryId,
          snippets: response.snippets,
          totalResults: response.totalResults,
          processingTimeMs: response.processingTimeMs,
          suggestions: response.suggestions,
          relatedQueries: response.relatedQueries
        },
        timestamp: Date.now(),
        agentId: message.agentId
      });
    } catch (error) {
      console.error('Error handling query message:', error);
      
      // Send error response
      await this.sendToAgent(message.agentId, {
        type: 'query',
        payload: {
          type: 'error',
          error: 'Failed to process query',
          details: error.message
        },
        timestamp: Date.now(),
        agentId: message.agentId
      });
    }
  }

  // Handle feedback messages
  private static async handleFeedbackMessage(message: WebSocketMessage): Promise<void> {
    try {
      const { snippetId, feedbackType, feedbackText, suggestedImprovement, confidenceScore } = message.payload;
      
      const feedback = await AgentAPIService.submitFeedback(
        message.agentId,
        snippetId,
        feedbackType,
        feedbackText,
        suggestedImprovement,
        confidenceScore
      );

      // Send confirmation back to agent
      await this.sendToAgent(message.agentId, {
        type: 'feedback',
        payload: {
          type: 'confirmation',
          feedbackId: feedback.id,
          status: 'received'
        },
        timestamp: Date.now(),
        agentId: message.agentId
      });
    } catch (error) {
      console.error('Error handling feedback message:', error);
    }
  }

  // Handle summary requests
  private static async handleSummaryRequest(message: WebSocketMessage): Promise<void> {
    try {
      const { documentId, chunkSize, requestContext } = message.payload;
      
      const summary = await AgentAPIService.summarizeDocument(
        documentId,
        message.agentId,
        chunkSize,
        requestContext
      );

      // Send summary back to agent
      await this.sendToAgent(message.agentId, {
        type: 'summary_request',
        payload: {
          type: 'response',
          summaryId: summary.id,
          summaryText: summary.summaryText,
          documentId: summary.documentId
        },
        timestamp: Date.now(),
        agentId: message.agentId
      });
    } catch (error) {
      console.error('Error handling summary request:', error);
    }
  }

  // Handle status updates
  private static async handleStatusUpdate(message: WebSocketMessage): Promise<void> {
    try {
      const { status, metadata } = message.payload;
      
      // Update agent status in database
      await blink.db.agents.update(message.agentId, {
        status,
        lastActivity: new Date().toISOString(),
        metadata: JSON.stringify(metadata)
      });

      console.log(`Agent ${message.agentId} status updated to: ${status}`);
    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }

  // Register message handler for an agent
  static registerMessageHandler(agentId: string, handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.set(agentId, handler);
  }

  // Unregister message handler
  static unregisterMessageHandler(agentId: string): void {
    this.messageHandlers.delete(agentId);
  }

  // Disconnect agent
  static async disconnectAgent(agentId: string): Promise<void> {
    try {
      const channelName = `agent-${agentId}`;
      const channelData = this.channels.get(channelName);
      
      if (channelData) {
        channelData.unsubscribe();
        await channelData.channel.unsubscribe();
        this.channels.delete(channelName);
      }

      this.unregisterMessageHandler(agentId);
      
      console.log(`Agent ${agentId} disconnected`);
    } catch (error) {
      console.error('Error disconnecting agent:', error);
    }
  }

  // Get connected agents
  static getConnectedAgents(): string[] {
    return Array.from(this.channels.keys()).map(channelName => 
      channelName.replace('agent-', '')
    );
  }

  // Check if agent is connected
  static isAgentConnected(agentId: string): boolean {
    return this.channels.has(`agent-${agentId}`);
  }
}