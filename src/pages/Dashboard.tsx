import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Bot,
  Search,
  TrendingUp,
  Activity,
  Database,
  Zap,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Document, Agent, DocumentAccessLog } from '@/types'

export function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [recentActivity, setRecentActivity] = useState<DocumentAccessLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load documents
      const docsData = await blink.db.documents.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        limit: 10
      })
      setDocuments(docsData)

      // Load agents
      const agentsData = await blink.db.agents.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        limit: 10
      })
      setAgents(agentsData)

      // Load recent activity
      const activityData = await blink.db.document_access_logs.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        limit: 20
      })
      setRecentActivity(activityData)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const stats = [
    {
      title: 'Total Documents',
      value: documents.length.toString(),
      description: '+12% from last month',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Active Agents',
      value: agents.length.toString(),
      description: '+3 new this week',
      icon: Bot,
      color: 'text-purple-600'
    },
    {
      title: 'API Requests',
      value: recentActivity.length.toString(),
      description: '+23% from yesterday',
      icon: Zap,
      color: 'text-green-600'
    },
    {
      title: 'Search Queries',
      value: recentActivity.filter(log => log.access_type === 'search').length.toString(),
      description: 'Last 24 hours',
      icon: Search,
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Documents
            </CardTitle>
            <CardDescription>
              Latest documents added to your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {doc.format}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        v{doc.version}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {(doc.relevance_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">relevance</div>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents yet. Start by adding your first document.</p>
                  <Button className="mt-4" size="sm">
                    Add Document
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vector Database</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              <Progress value={95} className="h-2" />
              <p className="text-xs text-muted-foreground">95% capacity</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Search Index</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Synced
                </Badge>
              </div>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-muted-foreground">Last updated 2 min ago</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Gateway</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              <Progress value={88} className="h-2" />
              <p className="text-xs text-muted-foreground">88ms avg response</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest interactions with your documentation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="search">Searches</TabsTrigger>
              <TabsTrigger value="api_request">API Calls</TabsTrigger>
              <TabsTrigger value="view">Views</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 mt-4">
              {recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.access_type === 'search' && (
                      <Search className="h-4 w-4 text-blue-600" />
                    )}
                    {activity.access_type === 'api_request' && (
                      <Zap className="h-4 w-4 text-green-600" />
                    )}
                    {activity.access_type === 'view' && (
                      <FileText className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.access_type === 'search' && 'Document Search'}
                      {activity.access_type === 'api_request' && 'API Request'}
                      {activity.access_type === 'view' && 'Document View'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.query_text || `Document ID: ${activity.document_id}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </p>
                    {activity.relevance_score && (
                      <p className="text-xs font-medium">
                        {(activity.relevance_score * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity to display.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="search">
              {/* Search-specific activity */}
            </TabsContent>
            <TabsContent value="api_request">
              {/* API request-specific activity */}
            </TabsContent>
            <TabsContent value="view">
              {/* View-specific activity */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}