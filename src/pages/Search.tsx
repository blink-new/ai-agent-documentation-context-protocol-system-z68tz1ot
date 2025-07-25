import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search as SearchIcon,
  Brain,
  Zap,
  Target,
  TrendingUp,
  FileText,
  Eye
} from 'lucide-react'
import { VectorSearchEngine } from '@/components/VectorSearchEngine'

export function Search() {
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('search')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Search & Discovery</h1>
        <p className="text-muted-foreground">
          Advanced AI-powered semantic search with vector embeddings and relevance scoring
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <SearchIcon className="h-4 w-4 mr-2" />
            Vector Search
          </TabsTrigger>
          <TabsTrigger value="results">
            <Target className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <VectorSearchEngine 
            onResultSelect={(result) => {
              setSelectedResult(result)
              setActiveTab('results')
            }}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {selectedResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Selected Document
                </CardTitle>
                <CardDescription>
                  Detailed view of the selected search result
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{selectedResult.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">{selectedResult.category}</Badge>
                      <Badge variant="outline">
                        {(selectedResult.similarity * 100).toFixed(1)}% match
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by {selectedResult.metadata.author}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full
                    </Button>
                    <Button size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Use Context
                    </Button>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <p className="text-muted-foreground">{selectedResult.content}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedResult.topics.map((topic: string) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Result Selected</h3>
                <p className="text-muted-foreground text-center">
                  Perform a search and select a result to view detailed information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Search Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Searches</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Results per Search</span>
                    <span className="font-semibold">8.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Relevance Score</span>
                    <span className="font-semibold">87.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Search Success Rate</span>
                    <span className="font-semibold">94.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Search Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { term: 'API authentication', count: 156 },
                    { term: 'database setup', count: 134 },
                    { term: 'security policies', count: 98 },
                    { term: 'deployment guide', count: 87 },
                    { term: 'troubleshooting', count: 76 }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.term}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Tips & Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <SearchIcon className="h-4 w-4" />
                    Vector Search Features
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Semantic understanding of query context</li>
                    <li>• Similarity matching with vector embeddings</li>
                    <li>• Relevance scoring based on content analysis</li>
                    <li>• Support for natural language queries</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI-Powered Enhancements
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Real-time document indexing and embedding</li>
                    <li>• Context-aware result ranking</li>
                    <li>• Multi-format content understanding</li>
                    <li>• Continuous learning from search patterns</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}