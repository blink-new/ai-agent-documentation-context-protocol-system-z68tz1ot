import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Search,
  Zap,
  Clock,
  Target,
  Activity
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Document, Agent, DocumentAccessLog } from '@/types'

export function Analytics() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [accessLogs, setAccessLogs] = useState<DocumentAccessLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadAnalyticsData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load all data for analytics
      const [docsData, agentsData, logsData] = await Promise.all([
        blink.db.documents.list({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' }
        }),
        blink.db.agents.list({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' }
        }),
        blink.db.document_access_logs.list({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
          limit: 1000
        })
      ])

      setDocuments(docsData)
      setAgents(agentsData)
      setAccessLogs(logsData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  // Calculate analytics metrics
  const totalDocuments = documents.length
  const totalAgents = agents.length
  const totalApiCalls = accessLogs.filter(log => log.access_type === 'api_request').length
  const totalSearches = accessLogs.filter(log => log.access_type === 'search').length

  // Document format distribution
  const formatData = documents.reduce((acc, doc) => {
    acc[doc.format] = (acc[doc.format] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formatChartData = Object.entries(formatData).map(([format, count]) => ({
    name: format.toUpperCase(),
    value: count,
    color: {
      markdown: '#3B82F6',
      html: '#F59E0B',
      json: '#10B981',
      pdf: '#EF4444'
    }[format] || '#6B7280'
  }))

  // Category distribution
  const categoryData = documents.reduce((acc, doc) => {
    const category = doc.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryData).map(([category, count]) => ({
    category,
    documents: count
  }))

  // Activity over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  const activityData = last7Days.map(date => {
    const dayLogs = accessLogs.filter(log => 
      log.created_at.startsWith(date)
    )
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      searches: dayLogs.filter(log => log.access_type === 'search').length,
      api_calls: dayLogs.filter(log => log.access_type === 'api_request').length,
      views: dayLogs.filter(log => log.access_type === 'view').length
    }
  })

  // Top performing documents
  const documentPerformance = documents.map(doc => {
    const docLogs = accessLogs.filter(log => log.document_id === doc.id)
    return {
      ...doc,
      access_count: docLogs.length,
      avg_relevance: docLogs.reduce((sum, log) => sum + (log.relevance_score || 0), 0) / docLogs.length || 0
    }
  }).sort((a, b) => b.access_count - a.access_count).slice(0, 10)

  // Agent activity
  const agentActivity = agents.map(agent => {
    const agentLogs = accessLogs.filter(log => log.agent_id === agent.id)
    return {
      ...agent,
      requests: agentLogs.length,
      avg_relevance: agentLogs.reduce((sum, log) => sum + (log.relevance_score || 0), 0) / agentLogs.length || 0
    }
  }).sort((a, b) => b.requests - a.requests)

  const stats = [
    {
      title: 'Total Documents',
      value: totalDocuments.toString(),
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Active Agents',
      value: totalAgents.toString(),
      change: '+3',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'API Calls',
      value: totalApiCalls.toString(),
      change: '+23%',
      icon: Zap,
      color: 'text-green-600'
    },
    {
      title: 'Search Queries',
      value: totalSearches.toString(),
      change: '+15%',
      icon: Search,
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Monitor usage patterns and system performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity Over Time
            </CardTitle>
            <CardDescription>
              Daily activity for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="searches" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="api_calls" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="views" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Document Formats
            </CardTitle>
            <CardDescription>
              Distribution of document types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Category Performance
          </CardTitle>
          <CardDescription>
            Document count by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="documents" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Top Documents</TabsTrigger>
          <TabsTrigger value="agents">Agent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Top Performing Documents
              </CardTitle>
              <CardDescription>
                Most accessed documents with relevance scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentPerformance.map((doc, index) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <h4 className="font-medium">{doc.title}</h4>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>{doc.format}</span>
                        <span>{doc.category}</span>
                        <span>v{doc.version}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{doc.access_count}</div>
                      <div className="text-xs text-muted-foreground">accesses</div>
                      <div className="text-sm font-medium text-green-600">
                        {(doc.avg_relevance * 100).toFixed(1)}% avg relevance
                      </div>
                    </div>
                  </div>
                ))}
                {documentPerformance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No document access data available yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Agent Activity Summary
              </CardTitle>
              <CardDescription>
                API usage and performance by agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentActivity.map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <h4 className="font-medium">{agent.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {agent.access_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agent.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{agent.requests}</div>
                      <div className="text-xs text-muted-foreground">requests</div>
                      <div className="text-sm font-medium text-blue-600">
                        {(agent.avg_relevance * 100).toFixed(1)}% avg relevance
                      </div>
                    </div>
                  </div>
                ))}
                {agentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No agent activity data available yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}