import { blink } from '../blink/client';
import type { PluginIntegration, PluginFunction, LangChainTool } from '../types/agent-interaction';
import { AgentAPIService } from './AgentAPIService';



export class PluginService {
  // LangChain Tool Integration
  static createLangChainTool(): LangChainTool {
    return {
      name: 'documentation_context_retrieval',
      description: 'Retrieve relevant documentation context based on natural language queries. Use this tool when you need to find specific information from documentation, manuals, policies, or workflows.',
      func: async (input: string): Promise<string> => {
        try {
          const parsedInput = this.parseLangChainInput(input);
          const response = await AgentAPIService.queryContext({
            agentId: parsedInput.agentId || 'langchain_agent',
            query: parsedInput.query,
            intent: parsedInput.intent,
            taskContext: parsedInput.taskContext,
            maxResults: parsedInput.maxResults || 5,
            minRelevanceScore: parsedInput.minRelevanceScore || 0.7
          });

          return this.formatLangChainResponse(response);
        } catch (error) {
          console.error('LangChain tool error:', error);
          return `Error retrieving documentation context: ${error.message}`;
        }
      },
      returnDirect: false
    };
  }

  // OpenAI Function Integration
  static createOpenAIFunction(): PluginFunction {
    return {
      name: 'get_documentation_context',
      description: 'Retrieve relevant documentation context snippets based on a natural language query. This function searches through stored documents, manuals, policies, and workflows to find the most relevant information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The natural language query describing what information you need from the documentation'
          },
          intent: {
            type: 'string',
            description: 'The intent or purpose of the query (e.g., "troubleshooting", "policy_lookup", "procedure_steps")',
            enum: ['troubleshooting', 'policy_lookup', 'procedure_steps', 'api_reference', 'general_info']
          },
          task_context: {
            type: 'string',
            description: 'Additional context about the task being performed'
          },
          max_results: {
            type: 'integer',
            description: 'Maximum number of context snippets to return (default: 5)',
            minimum: 1,
            maximum: 20
          },
          min_relevance_score: {
            type: 'number',
            description: 'Minimum relevance score for results (0.0 to 1.0, default: 0.7)',
            minimum: 0.0,
            maximum: 1.0
          },
          document_categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter results to specific document categories'
          }
        },
        required: ['query']
      }
    };
  }

  // Execute OpenAI Function
  static async executeOpenAIFunction(functionCall: any): Promise<string> {
    try {
      const { query, intent, task_context, max_results, min_relevance_score, document_categories } = functionCall.arguments;
      
      const response = await AgentAPIService.queryContext({
        agentId: 'openai_function_agent',
        query,
        intent,
        taskContext: task_context,
        maxResults: max_results || 5,
        minRelevanceScore: min_relevance_score || 0.7,
        documentFilters: {
          categories: document_categories
        }
      });

      return JSON.stringify({
        query_id: response.queryId,
        context_snippets: response.snippets.map(snippet => ({
          id: snippet.id,
          text: snippet.snippetText,
          relevance_score: snippet.relevanceScore,
          document_metadata: snippet.metadata,
          source_document: snippet.documentId
        })),
        total_results: response.totalResults,
        processing_time_ms: response.processingTimeMs,
        suggestions: response.suggestions,
        related_queries: response.relatedQueries
      });
    } catch (error) {
      console.error('OpenAI function execution error:', error);
      return JSON.stringify({
        error: 'Failed to retrieve documentation context',
        details: error.message
      });
    }
  }

  // Register Plugin Integration
  static async registerPlugin(
    pluginType: 'langchain' | 'openai_function' | 'custom',
    pluginName: string,
    configuration: Record<string, any>,
    agentId?: string
  ): Promise<PluginIntegration> {
    try {
      const user = await blink.auth.me();
      const pluginId = `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const plugin: PluginIntegration = {
        id: pluginId,
        pluginType,
        pluginName,
        configuration,
        isActive: true,
        agentId,
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      await blink.db.pluginIntegrations.create(plugin);
      return plugin;
    } catch (error) {
      console.error('Error registering plugin:', error);
      throw new Error('Failed to register plugin');
    }
  }

  // Get Plugin Integrations
  static async getPluginIntegrations(agentId?: string): Promise<PluginIntegration[]> {
    try {
      const whereClause = agentId ? { agentId } : {};
      return await blink.db.pluginIntegrations.list({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Error getting plugin integrations:', error);
      throw new Error('Failed to get plugin integrations');
    }
  }

  // Update Plugin Configuration
  static async updatePluginConfiguration(
    pluginId: string,
    configuration: Record<string, any>
  ): Promise<void> {
    try {
      await blink.db.pluginIntegrations.update(pluginId, {
        configuration: JSON.stringify(configuration)
      });
    } catch (error) {
      console.error('Error updating plugin configuration:', error);
      throw new Error('Failed to update plugin configuration');
    }
  }

  // Toggle Plugin Status
  static async togglePluginStatus(pluginId: string, isActive: boolean): Promise<void> {
    try {
      await blink.db.pluginIntegrations.update(pluginId, { isActive });
    } catch (error) {
      console.error('Error toggling plugin status:', error);
      throw new Error('Failed to toggle plugin status');
    }
  }

  // Generate Plugin Code Examples
  static generateLangChainExample(): string {
    return `
# LangChain Integration Example

from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType
from langchain.llms import OpenAI
import requests

def documentation_context_retrieval(query: str) -> str:
    """Retrieve documentation context using the DMS API"""
    response = requests.post(
        'https://your-dms-api.com/api/agents/query',
        headers={'Authorization': 'Bearer YOUR_API_KEY'},
        json={
            'agentId': 'langchain_agent',
            'query': query,
            'intent': 'general_info',
            'maxResults': 5
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        snippets = data.get('snippets', [])
        
        context = "\\n\\n".join([
            f"Source: {snippet['metadata']['title']}\\n"
            f"Relevance: {snippet['relevanceScore']:.2f}\\n"
            f"Content: {snippet['snippetText']}"
            for snippet in snippets
        ])
        
        return context
    else:
        return f"Error retrieving context: {response.text}"

# Create the tool
documentation_tool = Tool(
    name="documentation_context_retrieval",
    description="Retrieve relevant documentation context based on natural language queries",
    func=documentation_context_retrieval
)

# Initialize agent with the tool
llm = OpenAI(temperature=0)
agent = initialize_agent(
    [documentation_tool],
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Use the agent
result = agent.run("Find the refund policy steps in the onboarding guide")
print(result)
`;
  }

  static generateOpenAIFunctionExample(): string {
    return `
# OpenAI Function Integration Example

import openai
import json

# Define the function
functions = [
    {
        "name": "get_documentation_context",
        "description": "Retrieve relevant documentation context snippets",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language query for documentation search"
                },
                "intent": {
                    "type": "string",
                    "description": "Intent of the query",
                    "enum": ["troubleshooting", "policy_lookup", "procedure_steps", "api_reference"]
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results",
                    "minimum": 1,
                    "maximum": 20
                }
            },
            "required": ["query"]
        }
    }
]

# Chat completion with function calling
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "I need to find information about the refund policy"}
    ],
    functions=functions,
    function_call="auto"
)

# Handle function call
if response.choices[0].message.get("function_call"):
    function_call = response.choices[0].message["function_call"]
    
    if function_call["name"] == "get_documentation_context":
        # Execute the function (call your DMS API)
        function_args = json.loads(function_call["arguments"])
        context_result = call_dms_api(function_args)
        
        # Continue conversation with context
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": "I need to find information about the refund policy"},
                response.choices[0].message,
                {"role": "function", "name": "get_documentation_context", "content": context_result}
            ]
        )
        
        print(response.choices[0].message["content"])
`;
  }

  static generateCustomPluginExample(): string {
    return `
# Custom Plugin Integration Example

class DocumentationContextPlugin:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Authorization': f'Bearer {api_key}'})
    
    async def query_context(self, query: str, **kwargs) -> dict:
        """Query documentation context"""
        payload = {
            'agentId': kwargs.get('agent_id', 'custom_agent'),
            'query': query,
            'intent': kwargs.get('intent'),
            'taskContext': kwargs.get('task_context'),
            'maxResults': kwargs.get('max_results', 5),
            'minRelevanceScore': kwargs.get('min_relevance_score', 0.7)
        }
        
        response = self.session.post(f'{self.base_url}/api/agents/query', json=payload)
        return response.json()
    
    async def submit_feedback(self, snippet_id: str, feedback_type: str, **kwargs) -> dict:
        """Submit feedback on context snippet"""
        payload = {
            'agentId': kwargs.get('agent_id', 'custom_agent'),
            'snippetId': snippet_id,
            'feedbackType': feedback_type,
            'feedbackText': kwargs.get('feedback_text'),
            'confidenceScore': kwargs.get('confidence_score')
        }
        
        response = self.session.post(f'{self.base_url}/api/agents/feedback', json=payload)
        return response.json()
    
    async def request_summary(self, document_id: str, **kwargs) -> dict:
        """Request document summary"""
        payload = {
            'agentId': kwargs.get('agent_id', 'custom_agent'),
            'documentId': document_id,
            'chunkSize': kwargs.get('chunk_size'),
            'requestContext': kwargs.get('request_context')
        }
        
        response = self.session.post(f'{self.base_url}/api/agents/summarize', json=payload)
        return response.json()

# Usage
plugin = DocumentationContextPlugin(
    api_key='your_api_key',
    base_url='https://your-dms-api.com'
)

# Query context
result = await plugin.query_context(
    "Find refund policy steps",
    intent="policy_lookup",
    max_results=3
)

# Submit feedback
feedback = await plugin.submit_feedback(
    snippet_id="snippet_123",
    feedback_type="helpful",
    confidence_score=0.9
)
`;
  }

  // Private helper methods
  private static parseLangChainInput(input: string): any {
    try {
      // Try to parse as JSON first
      return JSON.parse(input);
    } catch {
      // If not JSON, treat as simple query string
      return {
        query: input,
        agentId: 'langchain_agent'
      };
    }
  }

  private static formatLangChainResponse(response: any): string {
    const snippets = response.snippets.map((snippet: any, index: number) => 
      `[${index + 1}] ${snippet.metadata?.title || 'Document'} (Relevance: ${snippet.relevanceScore.toFixed(2)}):\n${snippet.snippetText}\n`
    ).join('\n');

    return `Found ${response.totalResults} relevant context snippets:\n\n${snippets}\n\nProcessing time: ${response.processingTimeMs}ms\n\nSuggestions: ${response.suggestions?.join(', ') || 'None'}`;
  }
}