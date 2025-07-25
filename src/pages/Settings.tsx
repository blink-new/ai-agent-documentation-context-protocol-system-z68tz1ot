import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Settings as SettingsIcon,
  Database,
  Shield,
  Bell,
  Palette,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Key,
  Globe,
  Zap
} from 'lucide-react'
import { blink } from '@/blink/client'
import { SecurityMonitoringDashboard } from '@/components/SecurityMonitoringDashboard'

export function Settings() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState({
    // General settings
    project_name: 'AI Documentation System',
    description: 'Advanced documentation management for AI agents',
    
    // Vector database settings
    vector_db_provider: 'chroma',
    embedding_model: 'text-embedding-ada-002',
    chunk_size: 1000,
    chunk_overlap: 200,
    
    // Search settings
    search_enabled: true,
    semantic_search: true,
    relevance_threshold: 0.7,
    max_results: 50,
    
    // API settings
    rate_limiting: true,
    default_rate_limit: 100,
    api_versioning: true,
    cors_enabled: true,
    
    // Security settings
    require_authentication: true,
    api_key_rotation: false,
    audit_logging: true,
    encryption_at_rest: true,
    
    // Notification settings
    email_notifications: true,
    webhook_notifications: false,
    slack_notifications: false,
    
    // Performance settings
    cache_enabled: true,
    cache_ttl: 3600,
    auto_indexing: true,
    background_processing: true
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadUserData = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      // Simulate data export
      const exportData = {
        documents: [],
        agents: [],
        settings: settings,
        exported_at: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `documentation-system-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const handleResetSystem = async () => {
    if (confirm('Are you sure you want to reset the system? This will delete all documents and agents.')) {
      setLoading(true)
      try {
        // Simulate system reset
        await new Promise(resolve => setTimeout(resolve, 2000))
        alert('System reset completed successfully.')
      } catch (error) {
        console.error('Error resetting system:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your documentation management system
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <span className="text-green-600">✓ Saved</span>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="vector">Vector DB</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic configuration for your documentation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project Name</Label>
                  <Input
                    id="project_name"
                    value={settings.project_name}
                    onChange={(e) => setSettings({ ...settings, project_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_email">User Email</Label>
                  <Input
                    id="user_email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Search</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow searching through documents
                  </p>
                </div>
                <Switch
                  checked={settings.search_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, search_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Semantic Search</Label>
                  <p className="text-sm text-muted-foreground">
                    Use AI-powered semantic search
                  </p>
                </div>
                <Switch
                  checked={settings.semantic_search}
                  onCheckedChange={(checked) => setSettings({ ...settings, semantic_search: checked })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="relevance_threshold">Relevance Threshold</Label>
                  <Input
                    id="relevance_threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.relevance_threshold}
                    onChange={(e) => setSettings({ ...settings, relevance_threshold: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_results">Max Results</Label>
                  <Input
                    id="max_results"
                    type="number"
                    value={settings.max_results}
                    onChange={(e) => setSettings({ ...settings, max_results: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vector" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Vector Database Configuration
              </CardTitle>
              <CardDescription>
                Configure vector embeddings and similarity search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vector_db_provider">Vector DB Provider</Label>
                  <Input
                    id="vector_db_provider"
                    value={settings.vector_db_provider}
                    onChange={(e) => setSettings({ ...settings, vector_db_provider: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embedding_model">Embedding Model</Label>
                  <Input
                    id="embedding_model"
                    value={settings.embedding_model}
                    onChange={(e) => setSettings({ ...settings, embedding_model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chunk_size">Chunk Size</Label>
                  <Input
                    id="chunk_size"
                    type="number"
                    value={settings.chunk_size}
                    onChange={(e) => setSettings({ ...settings, chunk_size: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chunk_overlap">Chunk Overlap</Label>
                  <Input
                    id="chunk_overlap"
                    type="number"
                    value={settings.chunk_overlap}
                    onChange={(e) => setSettings({ ...settings, chunk_overlap: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API access and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable API rate limiting
                  </p>
                </div>
                <Switch
                  checked={settings.rate_limiting}
                  onCheckedChange={(checked) => setSettings({ ...settings, rate_limiting: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CORS Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow cross-origin requests
                  </p>
                </div>
                <Switch
                  checked={settings.cors_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, cors_enabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rate_limit">Default Rate Limit (requests/hour)</Label>
                <Input
                  id="default_rate_limit"
                  type="number"
                  value={settings.default_rate_limit}
                  onChange={(e) => setSettings({ ...settings, default_rate_limit: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require API key for all requests
                  </p>
                </div>
                <Switch
                  checked={settings.require_authentication}
                  onCheckedChange={(checked) => setSettings({ ...settings, require_authentication: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Key Rotation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rotate API keys
                  </p>
                </div>
                <Switch
                  checked={settings.api_key_rotation}
                  onCheckedChange={(checked) => setSettings({ ...settings, api_key_rotation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all API requests and access
                  </p>
                </div>
                <Switch
                  checked={settings.audit_logging}
                  onCheckedChange={(checked) => setSettings({ ...settings, audit_logging: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Encryption at Rest</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt stored documents
                  </p>
                </div>
                <Switch
                  checked={settings.encryption_at_rest}
                  onCheckedChange={(checked) => setSettings({ ...settings, encryption_at_rest: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <SecurityMonitoringDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhook Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to webhook URLs
                  </p>
                </div>
                <Switch
                  checked={settings.webhook_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, webhook_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to Slack channels
                  </p>
                </div>
                <Switch
                  checked={settings.slack_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, slack_notifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                Advanced performance and caching options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable response caching
                  </p>
                </div>
                <Switch
                  checked={settings.cache_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, cache_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically index new documents
                  </p>
                </div>
                <Switch
                  checked={settings.auto_indexing}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_indexing: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cache_ttl">Cache TTL (seconds)</Label>
                <Input
                  id="cache_ttl"
                  type="number"
                  value={settings.cache_ttl}
                  onChange={(e) => setSettings({ ...settings, cache_ttl: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
              <CardDescription>
                Import, export, and manage your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your documents and settings
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Import Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload documents from a backup file
                  </p>
                </div>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-destructive">Reset System</h4>
                  <p className="text-sm text-muted-foreground">
                    Delete all documents and agents (irreversible)
                  </p>
                </div>
                <Button variant="destructive" onClick={handleResetSystem}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}