import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Search,
  FileText,
  Bot,
  Zap,
  CheckCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import { blink } from '../blink/client';

interface ContextRecommendation {
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  confidence: number;
  documentId: string;
  documentTitle: string;
  snippetText: string;
  tags: string[];
  reasoning: string;
  usageCount: number;
  lastUsed?: string;
  feedback?: 'positive' | 'negative';
}

interface RecommendationPattern {
  id: string;
  pattern: string;
  frequency: number;
  successRate: number;
  avgRelevance: number;
  relatedTopics: string[];
  suggestedQueries: string[];
}

interface AIInsight {
  id: string;
  type: 'optimization' | 'pattern' | 'gap' | 'improvement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation: string;
}

export function ContextRecommendationEngine() {
  const [recommendations, setRecommendations] = useState<ContextRecommendation[]>([]);
  const [patterns, setPatterns] = useState<RecommendationPattern[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Simulate AI-powered recommendations
      const mockRecommendations: ContextRecommendation[] = [
        {
          id: 'rec_1',
          title: 'API Authentication Best Practices',
          description: 'Comprehensive guide on implementing secure API authentication',
          relevanceScore: 0.95,
          confidence: 0.88,
          documentId: 'doc_auth_guide',
          documentTitle: 'API Security Documentation',
          snippetText: 'When implementing API authentication, always use JWT tokens with proper expiration times and refresh mechanisms...',
          tags: ['authentication', 'security', 'api', 'jwt'],
          reasoning: 'High relevance based on recent queries about API security and authentication patterns',
          usageCount: 23,
          lastUsed: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'rec_2',
          title: 'Error Handling Strategies',
          description: 'Advanced error handling patterns for robust applications',
          relevanceScore: 0.87,
          confidence: 0.92,
          documentId: 'doc_error_handling',
          documentTitle: 'Development Best Practices',
          snippetText: 'Implement comprehensive error handling with proper logging, user-friendly messages, and graceful degradation...',
          tags: ['error-handling', 'development', 'best-practices'],
          reasoning: 'Frequently accessed content with high success rate in similar contexts',
          usageCount: 18,
          lastUsed: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'rec_3',
          title: 'Database Optimization Techniques',
          description: 'Performance optimization strategies for database queries',
          relevanceScore: 0.82,
          confidence: 0.85,
          documentId: 'doc_db_optimization',
          documentTitle: 'Database Performance Guide',
          snippetText: 'Optimize database performance through proper indexing, query optimization, and connection pooling...',
          tags: ['database', 'performance', 'optimization'],
          reasoning: 'Emerging pattern detected in recent agent queries about performance issues',
          usageCount: 12,
          lastUsed: new Date(Date.now() - 259200000).toISOString()
        }
      ];
      
      setRecommendations(mockRecommendations);
      
      // Load patterns
      const mockPatterns: RecommendationPattern[] = [
        {
          id: 'pattern_1',
          pattern: 'Authentication + Security',
          frequency: 45,
          successRate: 0.92,
          avgRelevance: 0.88,
          relatedTopics: ['JWT', 'OAuth', 'API Keys', 'RBAC'],
          suggestedQueries: [
            'How to implement JWT authentication?',
            'Best practices for API security',
            'OAuth 2.0 implementation guide'
          ]
        },
        {
          id: 'pattern_2',
          pattern: 'Performance + Optimization',
          frequency: 32,
          successRate: 0.85,
          avgRelevance: 0.83,
          relatedTopics: ['Caching', 'Database', 'CDN', 'Monitoring'],
          suggestedQueries: [
            'Database query optimization',
            'Caching strategies for web apps',
            'Performance monitoring tools'
          ]
        },
        {
          id: 'pattern_3',
          pattern: 'Error Handling + Debugging',
          frequency: 28,
          successRate: 0.89,
          avgRelevance: 0.86,
          relatedTopics: ['Logging', 'Monitoring', 'Testing', 'Debugging'],
          suggestedQueries: [
            'Error logging best practices',
            'Debugging production issues',
            'Exception handling patterns'
          ]
        }
      ];
      
      setPatterns(mockPatterns);
      
      // Load AI insights
      const mockInsights: AIInsight[] = [
        {
          id: 'insight_1',
          type: 'optimization',
          title: 'Query Pattern Optimization Opportunity',
          description: 'Detected 23% of queries could be optimized by pre-loading related context',
          impact: 'high',
          actionable: true,
          recommendation: 'Implement context pre-loading for frequently accessed document clusters'
        },
        {
          id: 'insight_2',
          type: 'gap',
          title: 'Documentation Gap Identified',
          description: 'High query volume for topics with limited documentation coverage',
          impact: 'medium',
          actionable: true,
          recommendation: 'Add documentation for deployment automation and CI/CD processes'
        },
        {
          id: 'insight_3',
          type: 'pattern',
          title: 'Emerging Usage Pattern',
          description: 'New pattern detected: Mobile development queries increasing 40%',
          impact: 'medium',
          actionable: false,
          recommendation: 'Monitor mobile development documentation usage and expand coverage'
        }
      ];
      
      setInsights(mockInsights);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const provideFeedback = async (recommendationId: string, feedback: 'positive' | 'negative') => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === recommendationId 
        ? { ...rec, feedback }
        : rec
    ));
    
    // In a real implementation, this would send feedback to the AI system
    console.log(`Feedback provided for ${recommendationId}: ${feedback}`);
  };

  const generateNewRecommendations = async () => {
    setLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Refresh recommendations
    await loadRecommendations();
  };

  const searchRecommendations = (query: string) => {
    if (!query.trim()) return recommendations;
    
    return recommendations.filter(rec => 
      rec.title.toLowerCase().includes(query.toLowerCase()) ||
      rec.description.toLowerCase().includes(query.toLowerCase()) ||
      rec.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const filterByCategory = (category: string) => {
    if (category === 'all') return recommendations;
    
    return recommendations.filter(rec => 
      rec.tags.includes(category)
    );
  };

  const getFilteredRecommendations = () => {
    let filtered = filterByCategory(selectedCategory);
    if (searchQuery) {
      filtered = searchRecommendations(searchQuery);
    }
    return filtered;
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      case 'pattern':
        return <TrendingUp className="h-4 w-4" />;
      case 'gap':
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Context Recommendation Engine</h2>
          <p className="text-gray-600">Intelligent context suggestions powered by machine learning</p>
        </div>
        
        <Button 
          onClick={generateNewRecommendations}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              <span>Generate New</span>
            </>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-2">
              {['all', 'authentication', 'performance', 'security', 'development'].map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Smart Recommendations</TabsTrigger>
          <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-4">
            {getFilteredRecommendations().map(rec => (
              <Card key={rec.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {(rec.relevanceScore * 100).toFixed(0)}% relevant
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(rec.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{rec.description}</p>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700 italic">"{rec.snippetText}"</p>
                        <p className="text-xs text-gray-500 mt-1">From: {rec.documentTitle}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Used {rec.usageCount} times</span>
                        {rec.lastUsed && (
                          <span>Last used: {new Date(rec.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant={rec.feedback === 'positive' ? 'default' : 'outline'}
                          onClick={() => provideFeedback(rec.id, 'positive')}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={rec.feedback === 'negative' ? 'destructive' : 'outline'}
                          onClick={() => provideFeedback(rec.id, 'negative')}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          <Star className="h-4 w-4 inline mr-1" />
                          {rec.relevanceScore.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Relevance Score</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {rec.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <Brain className="h-3 w-3 inline mr-1" />
                      {rec.reasoning}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getFilteredRecommendations().length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Found</h3>
                  <p className="text-gray-600">Try adjusting your search or category filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid gap-4">
            {patterns.map(pattern => (
              <Card key={pattern.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pattern.pattern}</span>
                    <Badge variant="secondary">
                      {pattern.frequency} occurrences
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(pattern.successRate * 100).toFixed(1)}%
                      </div>
                      <Progress value={pattern.successRate * 100} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500">Avg Relevance</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(pattern.avgRelevance * 100).toFixed(1)}%
                      </div>
                      <Progress value={pattern.avgRelevance * 100} className="h-2 mt-1" />
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500">Frequency</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {pattern.frequency}
                      </div>
                      <Progress value={(pattern.frequency / 50) * 100} className="h-2 mt-1" />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Related Topics</h4>
                    <div className="flex flex-wrap gap-1">
                      {pattern.relatedTopics.map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Suggested Queries</h4>
                    <div className="space-y-1">
                      {pattern.suggestedQueries.map((query, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          "{query}"
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {insights.map(insight => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                        <p className="text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}