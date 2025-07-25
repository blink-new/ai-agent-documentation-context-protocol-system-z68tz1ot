import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot,
  Plus,
  Key,
  Shield,
  Activity,
  Settings,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { blink } from '@/blink/client'
import { AgentInteractionHub } from '@/components/AgentInteractionHub'
import type { Agent } from '@/types'

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [activeTab, setActiveTab] = useState('management')

  // Form state for adding agents
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    access_level: 'read' as const,
    allowed_categories: '',
    rate_limit: 100,
    permissions: ''
  })

  const loadAgents = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.agents.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setAgents(data)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  const generateApiKey = () => {
    return `ak_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  }

  const handleAddAgent = async () => {
    try {
      const user = await blink.auth.me()
      const agentId = `agent_${Date.now()}`
      const apiKey = generateApiKey()
      
      await blink.db.agents.create({
        id: agentId,
        name: newAgent.name,
        description: newAgent.description,
        api_key: apiKey,
        access_level: newAgent.access_level,
        allowed_categories: newAgent.allowed_categories.split(',').map(cat => cat.trim()).filter(Boolean),
        rate_limit: newAgent.rate_limit,
        permissions: newAgent.permissions.split(',').map(perm => perm.trim()).filter(Boolean),
        user_id: user.id
      })

      // Reset form
      setNewAgent({
        name: '',
        description: '',
        access_level: 'read',
        allowed_categories: '',
        rate_limit: 100,
        permissions: ''
      })
      setIsAddDialogOpen(false)
      loadAgents()
    } catch (error) {
      console.error('Error adding agent:', error)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await blink.db.agents.delete(agentId)
      loadAgents()
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const toggleApiKeyVisibility = (agentId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }))
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    // You could add a toast notification here
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'read':
        return 'bg-blue-100 text-blue-800'
      case 'write':
        return 'bg-orange-100 text-orange-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'read':
        return <Eye className="h-3 w-3" />
      case 'write':
        return <Edit className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      default:
        return <Eye className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">
            Manage AI agents and their access to your documentation system
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="interactions">
              <Zap className="h-4 w-4 mr-2" />
              Interactions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'management' && (
        <>
          <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>
                Create a new AI agent with specific permissions and access controls
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Documentation Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access_level">Access Level</Label>
                  <Select
                    value={newAgent.access_level}
                    onValueChange={(value: any) => setNewAgent({ ...newAgent, access_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="write">Read & Write</SelectItem>
                      <SelectItem value="admin">Full Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="Describe the agent's purpose and capabilities..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allowed_categories">Allowed Categories</Label>
                  <Input
                    id="allowed_categories"
                    value={newAgent.allowed_categories}
                    onChange={(e) => setNewAgent({ ...newAgent, allowed_categories: e.target.value })}
                    placeholder="API, Documentation, Policies"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate_limit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    value={newAgent.rate_limit}
                    onChange={(e) => setNewAgent({ ...newAgent, rate_limit: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions</Label>
                <Input
                  id="permissions"
                  value={newAgent.permissions}
                  onChange={(e) => setNewAgent({ ...newAgent, permissions: e.target.value })}
                  placeholder="search, view, download"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of permissions</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAgent}>
                  Create Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <Badge className={getAccessLevelColor(agent.access_level)}>
                  {getAccessLevelIcon(agent.access_level)}
                  <span className="ml-1 capitalize">{agent.access_level}</span>
                </Badge>
              </div>
              {agent.description && (
                <CardDescription className="line-clamp-2">
                  {agent.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type={showApiKeys[agent.id] ? 'text' : 'password'}
                    value={agent.api_key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleApiKeyVisibility(agent.id)}
                  >
                    {showApiKeys[agent.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyApiKey(agent.api_key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Permissions</Label>
                <div className="flex flex-wrap gap-1">
                  {agent.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {agent.allowed_categories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Allowed Categories</Label>
                  <div className="flex flex-wrap gap-1">
                    {agent.allowed_categories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {agent.allowed_categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.allowed_categories.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-sm font-medium">{agent.rate_limit}</div>
                  <div className="text-xs text-muted-foreground">Rate Limit</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setActiveTab('interactions');
                    }}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first AI agent to start accessing your documentation system via API.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Integration Guide
          </CardTitle>
          <CardDescription>
            How to integrate your agents with the documentation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authentication" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>
            <TabsContent value="authentication" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">API Authentication</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Include your agent's API key in the Authorization header:
                </p>
                <code className="block bg-background p-3 rounded border text-sm font-mono">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </TabsContent>
            <TabsContent value="endpoints" className="space-y-4">
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Search Documents</h4>
                  <code className="block text-sm font-mono">GET /api/search?q=query&limit=10</code>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Get Document</h4>
                  <code className="block text-sm font-mono">GET /api/documents/:id</code>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Get Context</h4>
                  <code className="block text-sm font-mono">POST /api/context</code>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="examples" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">JavaScript Example</h4>
                <pre className="text-sm font-mono bg-background p-3 rounded border overflow-x-auto">
{`const response = await fetch('/api/search?q=authentication', {
  headers: {
    'Authorization': 'Bearer ak_your_api_key_here',
    'Content-Type': 'application/json'
  }
});
const results = await response.json();`}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </>
      )}

      {activeTab === 'interactions' && (
        <AgentInteractionHub selectedAgent={selectedAgent} />
      )}
    </div>
  )
}