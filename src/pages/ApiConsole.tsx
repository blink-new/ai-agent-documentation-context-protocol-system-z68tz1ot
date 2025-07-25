import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Code,
  Play,
  Copy,
  Download,
  Zap,
  FileText,
  Search,
  Database,
  Key,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Agent } from '@/types'

interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  headers: Record<string, string>
  body?: string
  response?: {
    status: number
    data: any
    duration: number
  }
}

export function ApiConsole() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [currentRequest, setCurrentRequest] = useState<ApiRequest>({
    method: 'GET',
    endpoint: '/api/search',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  })
  const [loading, setLoading] = useState(false)
  const [requestHistory, setRequestHistory] = useState<ApiRequest[]>([])

  const updateAuthHeader = (apiKey: string) => {
    setCurrentRequest(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        'Authorization': `Bearer ${apiKey}`
      }
    }))
  }

  const generateMockResponse = (endpoint: string, method: string) => {
    if (endpoint.includes('/search')) {
      return {
        results: [
          {
            id: 'doc_1',
            title: 'API Authentication Guide',
            content: 'Learn how to authenticate with our API using JWT tokens...',
            relevance_score: 0.95,
            category: 'API Documentation'
          },
          {
            id: 'doc_2',
            title: 'Rate Limiting Policies',
            content: 'Understanding rate limits and how to handle them...',
            relevance_score: 0.87,
            category: 'Policies'
          }
        ],
        total: 2,
        query: 'authentication'
      }
    } else if (endpoint.includes('/documents/')) {
      return {
        id: 'doc_1',
        title: 'API Authentication Guide',
        content: 'Complete guide to API authentication...',
        format: 'markdown',
        category: 'API Documentation',
        tags: ['api', 'auth', 'security'],
        version: 1,
        created_at: '2024-01-20T10:00:00Z'
      }
    } else if (endpoint.includes('/context')) {
      return {
        context_snippets: [
          {
            document_id: 'doc_1',
            snippet: 'To authenticate, include the Authorization header...',
            relevance: 0.95
          },
          {
            document_id: 'doc_2',
            snippet: 'Rate limits are enforced per API key...',
            relevance: 0.82
          }
        ],
        total_tokens: 150,
        processing_time: 45
      }
    }
    return { message: 'Success', timestamp: new Date().toISOString() }
  }

  const loadAgents = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.agents.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setAgents(data)
      if (data.length > 0) {
        setSelectedAgent(data[0].id)
        updateAuthHeader(data[0].api_key)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  useEffect(() => {
    loadAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId)
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      updateAuthHeader(agent.api_key)
    }
  }

  const executeRequest = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      // Simulate API request execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
      
      const mockResponse = {
        status: 200,
        data: generateMockResponse(currentRequest.endpoint, currentRequest.method),
        duration: Date.now() - startTime
      }

      const updatedRequest = {
        ...currentRequest,
        response: mockResponse
      }

      setCurrentRequest(updatedRequest)
      setRequestHistory(prev => [updatedRequest, ...prev.slice(0, 9)]) // Keep last 10 requests

      // Log API request
      const user = await blink.auth.me()
      await blink.db.document_access_logs.create({
        id: `log_${Date.now()}`,
        document_id: 'api_console',
        agent_id: selectedAgent,
        access_type: 'api_request',
        query_text: `${currentRequest.method} ${currentRequest.endpoint}`,
        user_id: user.id
      })

    } catch (error) {
      const errorResponse = {
        status: 500,
        data: { error: 'Internal Server Error', message: error.message },
        duration: Date.now() - startTime
      }

      setCurrentRequest(prev => ({
        ...prev,
        response: errorResponse
      }))
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const predefinedRequests = [
    {
      name: 'Search Documents',
      method: 'GET' as const,
      endpoint: '/api/search?q=authentication&limit=10',
      description: 'Search for documents containing specific keywords'
    },
    {
      name: 'Get Document',
      method: 'GET' as const,
      endpoint: '/api/documents/doc_123',
      description: 'Retrieve a specific document by ID'
    },
    {
      name: 'Get Context',
      method: 'POST' as const,
      endpoint: '/api/context',
      description: 'Get relevant context snippets for AI agents',
      body: JSON.stringify({
        query: 'How to implement authentication?',
        max_snippets: 5,
        categories: ['API Documentation', 'Security']
      }, null, 2)
    },
    {
      name: 'List Categories',
      method: 'GET' as const,
      endpoint: '/api/categories',
      description: 'Get all available document categories'
    }
  ]

  const loadPredefinedRequest = (request: typeof predefinedRequests[0]) => {
    setCurrentRequest({
      method: request.method,
      endpoint: request.endpoint,
      headers: currentRequest.headers,
      body: request.body
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">API Console</h1>
        <p className="text-muted-foreground">
          Test and explore the documentation API endpoints
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Request Builder
              </CardTitle>
              <CardDescription>
                Build and test API requests to your documentation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agent Selection */}
              <div className="space-y-2">
                <Label>Select Agent</Label>
                <Select value={selectedAgent} onValueChange={handleAgentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.access_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Method and Endpoint */}
              <div className="grid grid-cols-4 gap-2">
                <Select
                  value={currentRequest.method}
                  onValueChange={(value: any) => setCurrentRequest(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <div className="col-span-3">
                  <Input
                    value={currentRequest.endpoint}
                    onChange={(e) => setCurrentRequest(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="/api/endpoint"
                  />
                </div>
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <Label>Headers</Label>
                <Textarea
                  value={JSON.stringify(currentRequest.headers, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value)
                      setCurrentRequest(prev => ({ ...prev, headers }))
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              {/* Body (for POST/PUT) */}
              {(currentRequest.method === 'POST' || currentRequest.method === 'PUT') && (
                <div className="space-y-2">
                  <Label>Request Body</Label>
                  <Textarea
                    value={currentRequest.body || ''}
                    onChange={(e) => setCurrentRequest(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Request body (JSON)"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {/* Execute Button */}
              <Button onClick={executeRequest} disabled={loading} className="w-full">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Execute Request
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          {currentRequest.response && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Response
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={currentRequest.response.status < 400 ? 'default' : 'destructive'}
                      className="flex items-center"
                    >
                      {currentRequest.response.status < 400 ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {currentRequest.response.status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {currentRequest.response.duration}ms
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(currentRequest.response.data, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {JSON.stringify(currentRequest.response.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Predefined Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Quick Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {predefinedRequests.map((request, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => loadPredefinedRequest(request)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {request.method}
                      </Badge>
                      <span className="font-medium">{request.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.description}
                    </p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Request History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {requestHistory.length > 0 ? (
                requestHistory.map((request, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setCurrentRequest({ ...request, response: undefined })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {request.method}
                        </Badge>
                        {request.response && (
                          <Badge
                            variant={request.response.status < 400 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {request.response.status}
                          </Badge>
                        )}
                      </div>
                      {request.response && (
                        <span className="text-xs text-muted-foreground">
                          {request.response.duration}ms
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono mt-1 truncate">
                      {request.endpoint}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No requests yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Gateway</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Search Index</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Synced
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vector DB</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span className="font-medium">127ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}