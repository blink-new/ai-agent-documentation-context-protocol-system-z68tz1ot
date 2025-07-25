import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Search, Brain, Zap, Filter, Target, Sparkles } from 'lucide-react'
import { blink } from '@/blink/client'

interface SearchResult {
  id: string
  title: string
  content: string
  similarity: number
  category: string
  topics: string[]
  metadata: any
}

interface VectorSearchEngineProps {
  onResultSelect?: (result: SearchResult) => void
}

export function VectorSearchEngine({ onResultSelect }: VectorSearchEngineProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [similarityThreshold, setSimilarityThreshold] = useState([0.7])
  const [useSemanticSearch, setUseSemanticSearch] = useState(true)
  const [maxResults, setMaxResults] = useState([10])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const categories = ['API Documentation', 'Policies', 'Workflows', 'Manuals', 'Technical Specs']

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem('search_history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  const performVectorSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    
    try {
      // Generate query embedding
      const queryEmbedding = await blink.ai.generateText({
        prompt: `Generate a semantic representation for search query: "${query}"`,
        maxTokens: 100
      })

      // Simulate vector similarity search
      const mockResults: SearchResult[] = [
        {
          id: 'doc_1',
          title: 'API Authentication Guide',
          content: 'Complete guide to implementing secure API authentication using JWT tokens and OAuth 2.0 flows...',
          similarity: 0.92,
          category: 'API Documentation',
          topics: ['authentication', 'security', 'JWT', 'OAuth'],
          metadata: { author: 'Tech Team', lastUpdated: '2024-01-15' }
        },
        {
          id: 'doc_2',
          title: 'Data Processing Workflow',
          content: 'Step-by-step workflow for processing and analyzing large datasets using our ML pipeline...',
          similarity: 0.87,
          category: 'Workflows',
          topics: ['data processing', 'machine learning', 'pipeline'],
          metadata: { author: 'Data Team', lastUpdated: '2024-01-10' }
        },
        {
          id: 'doc_3',
          title: 'Security Policy Framework',
          content: 'Comprehensive security policies and procedures for handling sensitive data and user information...',
          similarity: 0.81,
          category: 'Policies',
          topics: ['security', 'compliance', 'data protection'],
          metadata: { author: 'Security Team', lastUpdated: '2024-01-20' }
        },
        {
          id: 'doc_4',
          title: 'Vector Database Setup',
          content: 'Technical documentation for setting up and configuring vector databases for semantic search...',
          similarity: 0.78,
          category: 'Technical Specs',
          topics: ['vector database', 'setup', 'configuration'],
          metadata: { author: 'DevOps Team', lastUpdated: '2024-01-12' }
        },
        {
          id: 'doc_5',
          title: 'User Manual - Advanced Features',
          content: 'Detailed user manual covering advanced features and configuration options for power users...',
          similarity: 0.75,
          category: 'Manuals',
          topics: ['user guide', 'advanced features', 'configuration'],
          metadata: { author: 'Product Team', lastUpdated: '2024-01-18' }
        }
      ]

      // Filter by similarity threshold
      let filteredResults = mockResults.filter(result => 
        result.similarity >= similarityThreshold[0]
      )

      // Filter by categories if selected
      if (selectedCategories.length > 0) {
        filteredResults = filteredResults.filter(result =>
          selectedCategories.includes(result.category)
        )
      }

      // Limit results
      filteredResults = filteredResults.slice(0, maxResults[0])

      setResults(filteredResults)

      // Add to search history
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('search_history', JSON.stringify(newHistory))

      // Log search analytics
      await blink.db.searchLogs.create({
        id: `search_${Date.now()}`,
        query,
        resultsCount: filteredResults.length,
        similarityThreshold: similarityThreshold[0],
        useSemanticSearch,
        categories: JSON.stringify(selectedCategories),
        timestamp: new Date().toISOString(),
        userId: 'current_user'
      })

    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-green-600'
    if (similarity >= 0.8) return 'text-blue-600'
    if (similarity >= 0.7) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Vector Search Engine
          </CardTitle>
          <CardDescription>
            AI-powered semantic search with vector similarity matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter your search query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performVectorSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={performVectorSearch} disabled={isSearching || !query.trim()}>
              {isSearching ? (
                <Zap className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recent Searches</Label>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((historyQuery, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setQuery(historyQuery)}
                  >
                    {historyQuery}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Similarity Threshold */}
          <div className="space-y-2">
            <Label>Similarity Threshold: {similarityThreshold[0].toFixed(2)}</Label>
            <Slider
              value={similarityThreshold}
              onValueChange={setSimilarityThreshold}
              max={1}
              min={0.1}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Less Similar</span>
              <span>More Similar</span>
            </div>
          </div>

          <Separator />

          {/* Max Results */}
          <div className="space-y-2">
            <Label>Max Results: {maxResults[0]}</Label>
            <Slider
              value={maxResults}
              onValueChange={setMaxResults}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Semantic Search Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Semantic Search</Label>
              <p className="text-sm text-muted-foreground">
                Use AI-powered semantic understanding
              </p>
            </div>
            <Switch
              checked={useSemanticSearch}
              onCheckedChange={setUseSemanticSearch}
            />
          </div>

          <Separator />

          {/* Category Filters */}
          <div className="space-y-3">
            <Label>Categories</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Switch
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label htmlFor={category} className="text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Search Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onResultSelect?.(result)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{result.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.category}</Badge>
                    <span className={`text-sm font-medium ${getSimilarityColor(result.similarity)}`}>
                      {(result.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {result.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {result.topics.slice(0, 3).map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {result.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{result.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    {result.metadata.author}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}