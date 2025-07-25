import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Activity, 
  Code, 
  Database, 
  Globe, 
  Settings,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { blink } from '../blink/client';
import type { Agent, AgentQuery, ContextSnippet, AgentFeedback } from '../types';



interface AgentInteractionHubProps {
  selectedAgent?: Agent;
}

export function AgentInteractionHub({ selectedAgent }: AgentInteractionHubProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(selectedAgent || null);
  const [queries, setQueries] = useState<AgentQuery[]>([]);
  const [snippets, setSnippets] = useState<ContextSnippet[]>([]);
  const [feedback, setFeedback] = useState<AgentFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Test Query Form
  const [testQuery, setTestQuery] = useState('');
  const [testIntent, setTestIntent] = useState('');
  const [testContext, setTestContext] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  // WebSocket Connection
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Plugin Integration
  const [pluginCode, setPluginCode] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState('langchain');

  const loadAgents = async () => {
    try {
      const agentList = await blink.db.agents.list({
        orderBy: { createdAt: 'desc' }
      });
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadAgentData = async (agentId: string) => {
    try {
      setLoading(true);
      
      // Load queries
      const agentQueries = await blink.db.agentQueries.list({
        where: { agentId },
        orderBy: { timestamp: 'desc' },
        limit: 50
      });
      setQueries(agentQueries);

      // Load snippets for recent queries
      if (agentQueries.length > 0) {
        const queryIds = agentQueries.slice(0, 10).map(q => q.id);
        const contextSnippets = await blink.db.contextSnippets.list({
          where: { queryId: { in: queryIds } },
          orderBy: { relevanceScore: 'desc' }
        });
        setSnippets(contextSnippets);
      }

      // Load feedback
      const agentFeedback = await blink.db.agentFeedback.list({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        limit: 20
      });
      setFeedback(agentFeedback);

    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAgentQuery = async () => {
    if (!activeAgent || !testQuery.trim()) return;

    try {
      setLoading(true);
      
      const response = await fetch('https://z68tz1ot--agent-api.functions.blink.new/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await blink.auth.getToken()}`
        },
        body: JSON.stringify({
          agentId: activeAgent.id,
          query: testQuery,
          intent: testIntent || undefined,
          taskContext: testContext || undefined,
          maxResults: 5,
          minRelevanceScore: 0.7
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(result);
        
        // Refresh agent data
        await loadAgentData(activeAgent.id);
      } else {
        console.error('Query failed:', await response.text());
      }
    } catch (error) {
      console.error('Error testing query:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (snippetId: string, feedbackType: string, feedbackText?: string) => {
    if (!activeAgent) return;

    try {
      const response = await fetch('https://z68tz1ot--agent-api.functions.blink.new/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await blink.auth.getToken()}`
        },
        body: JSON.stringify({
          agentId: activeAgent.id,
          snippetId,
          feedbackType,
          feedbackText,
          confidenceScore: 0.8
        })
      });

      if (response.ok) {
        // Refresh feedback data
        await loadAgentData(activeAgent.id);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const connectWebSocket = async () => {
    if (!activeAgent) return;

    try {
      setConnectionStatus('connecting');
      
      // Initialize WebSocket connection through Blink realtime
      const channel = blink.realtime.channel(`agent-${activeAgent.id}`);
      
      await channel.subscribe({
        userId: activeAgent.id,
        metadata: {
          type: 'ai_agent',
          capabilities: ['query', 'feedback', 'summarization'],
          status: 'online'
        }
      });

      channel.onMessage((message) => {
        setWsMessages(prev => [...prev, {
          ...message,
          timestamp: Date.now()
        }]);
      });

      setWsConnected(true);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('disconnected');
    }
  };

  const generatePluginCode = useCallback(() => {
    const baseUrl = 'https://z68tz1ot--agent-api.functions.blink.new';
    
    const templates = {
      langchain: `# LangChain Integration
from langchain.tools import Tool
import requests

def documentation_context_retrieval(query: str) -> str:
    response = requests.post(
        '${baseUrl}/query',
        headers={'Authorization': 'Bearer YOUR_API_KEY'},
        json={
            'agentId': '${activeAgent?.id || 'your_agent_id'}',
            'query': query,
            'intent': 'general_info',
            'maxResults': 5
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        snippets = data.get('snippets', [])
        return "\\n\\n".join([snippet['snippetText'] for snippet in snippets])
    return f"Error: {response.text}"

documentation_tool = Tool(
    name="documentation_context_retrieval",
    description="Retrieve relevant documentation context",
    func=documentation_context_retrieval
)`,
      
      openai: `# OpenAI Function Integration
import openai
import requests

functions = [{
    "name": "get_documentation_context",
    "description": "Retrieve relevant documentation context",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
            "intent": {"type": "string", "description": "Query intent"}
        },
        "required": ["query"]
    }
}]

def call_documentation_api(query, intent=None):
    response = requests.post(
        '${baseUrl}/query',
        headers={'Authorization': 'Bearer YOUR_API_KEY'},
        json={
            'agentId': '${activeAgent?.id || 'your_agent_id'}',
            'query': query,
            'intent': intent,
            'maxResults': 5
        }
    )
    return response.json()`,
      
      rest: `# REST API Integration
curl -X POST "${baseUrl}/query" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "agentId": "${activeAgent?.id || 'your_agent_id'}",
    "query": "Find refund policy steps",
    "intent": "policy_lookup",
    "maxResults": 5,
    "minRelevanceScore": 0.7
  }'`,
      
      websocket: `# WebSocket Integration
import asyncio
import websockets
import json

async def connect_agent_websocket():
    uri = "wss://your-websocket-endpoint"
    
    async with websockets.connect(uri) as websocket:
        # Send query
        await websocket.send(json.dumps({
            "type": "query",
            "payload": {
                "query": "Find documentation about API usage",
                "intent": "api_reference",
                "maxResults": 5
            },
            "agentId": "${activeAgent?.id || 'your_agent_id'}",
            "timestamp": int(time.time() * 1000)
        }))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"Received: {data}")

asyncio.run(connect_agent_websocket())`
    };

    setPluginCode(templates[selectedPlugin as keyof typeof templates] || templates.langchain);
  }, [selectedPlugin, activeAgent]);

  useEffect(() => {
    loadAgents();
    if (selectedAgent) {
      setActiveAgent(selectedAgent);
      loadAgentData(selectedAgent.id);
    }
  }, [selectedAgent]);

  useEffect(() => {
    generatePluginCode();
  }, [selectedPlugin, activeAgent, generatePluginCode]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Agent Interaction Hub</h2>
          <p className="text-gray-600">Manage AI agent integrations and monitor interactions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
          </div>
          
          <Select value={activeAgent?.id || ''} onValueChange={(value) => {
            const agent = agents.find(a => a.id === value);
            if (agent) {
              setActiveAgent(agent);
              loadAgentData(agent.id);
            }
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeAgent && (
        <Tabs defaultValue="testing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="testing">API Testing</TabsTrigger>
            <TabsTrigger value="queries">Query History</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="websocket">WebSocket</TabsTrigger>
            <TabsTrigger value="plugins">Plugin Integration</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* API Testing */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Test Agent API</span>
                </CardTitle>
                <CardDescription>
                  Test context retrieval and other API endpoints for {activeAgent.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Query</label>
                    <Textarea
                      placeholder="Enter your query (e.g., 'Find refund policy steps')"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intent (Optional)</label>
                    <Select value={testIntent} onValueChange={setTestIntent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select intent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific intent</SelectItem>
                        <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                        <SelectItem value="policy_lookup">Policy Lookup</SelectItem>
                        <SelectItem value="procedure_steps">Procedure Steps</SelectItem>
                        <SelectItem value="api_reference">API Reference</SelectItem>
                        <SelectItem value="general_info">General Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Task Context (Optional)</label>
                    <Textarea
                      placeholder="Additional context about the task"
                      value={testContext}
                      onChange={(e) => setTestContext(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Button 
                  onClick={testAgentQuery} 
                  disabled={loading || !testQuery.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing Query...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Test Query
                    </>
                  )}
                </Button>

                {testResults && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold">Query Results</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Total Results</div>
                        <div className="text-2xl font-bold text-blue-600">{testResults.totalResults}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-medium text-green-900">Processing Time</div>
                        <div className="text-2xl font-bold text-green-600">{testResults.processingTimeMs}ms</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="font-medium text-purple-900">Query ID</div>
                        <div className="text-sm font-mono text-purple-600">{testResults.queryId}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium">Context Snippets</h5>
                      {testResults.snippets.map((snippet: any, index: number) => (
                        <Card key={snippet.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">#{index + 1}</Badge>
                                <span className="text-sm font-medium">
                                  Relevance: {(snippet.relevanceScore * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => submitFeedback(snippet.id, 'helpful')}
                                >
                                  👍 Helpful
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => submitFeedback(snippet.id, 'outdated')}
                                >
                                  ⚠️ Outdated
                                </Button>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {snippet.snippetText}
                            </p>
                            {snippet.metadata && (
                              <div className="mt-2 text-xs text-gray-500">
                                Source: {JSON.parse(snippet.metadata).title || 'Unknown'}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {testResults.suggestions && testResults.suggestions.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Suggestions</h5>
                        <div className="flex flex-wrap gap-2">
                          {testResults.suggestions.map((suggestion: string, index: number) => (
                            <Badge key={index} variant="outline" className="cursor-pointer"
                              onClick={() => setTestQuery(suggestion)}>
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Query History */}
          <TabsContent value="queries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Query History</span>
                </CardTitle>
                <CardDescription>
                  Recent queries from {activeAgent.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No queries found for this agent
                    </div>
                  ) : (
                    queries.map(query => (
                      <Card key={query.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={query.queryType === 'context_retrieval' ? 'default' : 'secondary'}>
                                {query.queryType}
                              </Badge>
                              {query.intent && (
                                <Badge variant="outline">{query.intent}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(query.timestamp).toLocaleString()}
                            </div>
                          </div>
                          
                          <p className="text-gray-900 mb-2">{query.queryText}</p>
                          
                          {query.taskContext && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Context:</strong> {query.taskContext}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {query.responseTimeMs && (
                              <span>Response: {query.responseTimeMs}ms</span>
                            )}
                            {query.relevanceScore && (
                              <span>Relevance: {(query.relevanceScore * 100).toFixed(1)}%</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Agent Feedback</span>
                </CardTitle>
                <CardDescription>
                  Feedback submitted by {activeAgent.name} on context snippets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No feedback found for this agent
                    </div>
                  ) : (
                    feedback.map(fb => (
                      <Card key={fb.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                fb.feedbackType === 'helpful' ? 'default' :
                                fb.feedbackType === 'outdated' ? 'destructive' :
                                fb.feedbackType === 'incorrect' ? 'destructive' : 'secondary'
                              }>
                                {fb.feedbackType}
                              </Badge>
                              <Badge variant="outline">{fb.status}</Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(fb.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          {fb.feedbackText && (
                            <p className="text-gray-900 mb-2">{fb.feedbackText}</p>
                          )}
                          
                          {fb.suggestedImprovement && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-2">
                              <p className="text-sm text-blue-900">
                                <strong>Suggested Improvement:</strong> {fb.suggestedImprovement}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Snippet ID: {fb.snippetId}</span>
                            {fb.confidenceScore && (
                              <span>Confidence: {(fb.confidenceScore * 100).toFixed(1)}%</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WebSocket */}
          <TabsContent value="websocket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Real-time WebSocket Connection</span>
                </CardTitle>
                <CardDescription>
                  Manage real-time communication with {activeAgent.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(wsConnected ? 'connected' : 'disconnected')}
                    <span className="font-medium">
                      {wsConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  
                  <Button
                    onClick={connectWebSocket}
                    disabled={wsConnected}
                    variant={wsConnected ? 'outline' : 'default'}
                  >
                    {wsConnected ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    WebSocket endpoint: <code className="bg-gray-100 px-2 py-1 rounded">
                      wss://realtime.blink.new/agent-{activeAgent.id}
                    </code>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Recent Messages</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    {wsMessages.length === 0 ? (
                      <p className="text-gray-500 text-sm">No messages yet</p>
                    ) : (
                      wsMessages.map((msg, index) => (
                        <div key={index} className="text-sm font-mono mb-2 p-2 bg-white rounded border">
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                          <pre className="text-xs">{JSON.stringify(msg, null, 2)}</pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plugin Integration */}
          <TabsContent value="plugins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Plugin Integration</span>
                </CardTitle>
                <CardDescription>
                  Generate code for integrating {activeAgent.name} with various frameworks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">Framework:</label>
                  <Select value={selectedPlugin} onValueChange={setSelectedPlugin}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="langchain">LangChain</SelectItem>
                      <SelectItem value="openai">OpenAI Functions</SelectItem>
                      <SelectItem value="rest">REST API</SelectItem>
                      <SelectItem value="websocket">WebSocket</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={generatePluginCode} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Integration Code</label>
                  <Textarea
                    value={pluginCode}
                    onChange={(e) => setPluginCode(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Generated code will appear here..."
                  />
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Replace <code>YOUR_API_KEY</code> with your actual API key from the agent settings.
                    API endpoint: <code>https://z68tz1ot--agent-api.functions.blink.new</code>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Queries</p>
                      <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Context Snippets</p>
                      <p className="text-2xl font-bold text-gray-900">{snippets.length}</p>
                    </div>
                    <Database className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Feedback Items</p>
                      <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Response Time</span>
                      <span>{queries.length > 0 ? 
                        Math.round(queries.reduce((acc, q) => acc + (q.responseTimeMs || 0), 0) / queries.length) 
                        : 0}ms</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Relevance Score</span>
                      <span>{queries.length > 0 ? 
                        (queries.reduce((acc, q) => acc + (q.relevanceScore || 0), 0) / queries.length * 100).toFixed(1)
                        : 0}%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Positive Feedback Rate</span>
                      <span>{feedback.length > 0 ? 
                        (feedback.filter(f => f.feedbackType === 'helpful').length / feedback.length * 100).toFixed(1)
                        : 0}%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!activeAgent && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Agent Selected</h3>
            <p className="text-gray-600 mb-4">
              Select an AI agent from the dropdown above to start managing interactions
            </p>
            <Button onClick={loadAgents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Agents
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}