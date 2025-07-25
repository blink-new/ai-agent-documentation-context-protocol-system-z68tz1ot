import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Brain, Zap, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { blink } from '@/blink/client'

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  description: string
}

interface DocumentProcessorProps {
  documentId?: string
  onProcessingComplete?: (result: any) => void
}

export function DocumentProcessor({ documentId, onProcessingComplete }: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'extract',
      name: 'Text Extraction',
      status: 'pending',
      progress: 0,
      description: 'Extracting text content from document'
    },
    {
      id: 'chunk',
      name: 'Content Chunking',
      status: 'pending',
      progress: 0,
      description: 'Breaking content into semantic chunks'
    },
    {
      id: 'embed',
      name: 'Vector Embedding',
      status: 'pending',
      progress: 0,
      description: 'Generating vector embeddings for semantic search'
    },
    {
      id: 'index',
      name: 'Search Indexing',
      status: 'pending',
      progress: 0,
      description: 'Adding to search index and categorization'
    },
    {
      id: 'analyze',
      name: 'Content Analysis',
      status: 'pending',
      progress: 0,
      description: 'Analyzing content for topics and entities'
    }
  ])

  const updateStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }, [])

  const processDocument = async () => {
    if (!documentId) return

    setIsProcessing(true)
    
    try {
      // Step 1: Text Extraction
      updateStep('extract', { status: 'processing', progress: 20 })
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const extractedText = await blink.ai.generateText({
        prompt: `Extract and clean text content from document ${documentId}`,
        maxTokens: 2000
      })
      
      updateStep('extract', { status: 'completed', progress: 100 })

      // Step 2: Content Chunking
      updateStep('chunk', { status: 'processing', progress: 30 })
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const chunks = await blink.ai.generateObject({
        prompt: `Break this text into semantic chunks for better retrieval: ${extractedText.text.substring(0, 1000)}`,
        schema: {
          type: 'object',
          properties: {
            chunks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  topic: { type: 'string' },
                  importance: { type: 'number' }
                }
              }
            }
          }
        }
      })
      
      updateStep('chunk', { status: 'completed', progress: 100 })

      // Step 3: Vector Embedding
      updateStep('embed', { status: 'processing', progress: 50 })
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Simulate vector embedding generation
      const embeddings = chunks.object.chunks.map((chunk: any, index: number) => ({
        chunkId: `chunk_${index}`,
        vector: Array.from({ length: 384 }, () => Math.random() - 0.5),
        content: chunk.content,
        metadata: { topic: chunk.topic, importance: chunk.importance }
      }))
      
      updateStep('embed', { status: 'completed', progress: 100 })

      // Step 4: Search Indexing
      updateStep('index', { status: 'processing', progress: 70 })
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Store in database
      await blink.db.documentChunks.createMany(
        embeddings.map(emb => ({
          documentId,
          chunkId: emb.chunkId,
          content: emb.content,
          embedding: JSON.stringify(emb.vector),
          metadata: JSON.stringify(emb.metadata),
          createdAt: new Date().toISOString()
        }))
      )
      
      updateStep('index', { status: 'completed', progress: 100 })

      // Step 5: Content Analysis
      updateStep('analyze', { status: 'processing', progress: 90 })
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const analysis = await blink.ai.generateObject({
        prompt: `Analyze this document content and extract key information: ${extractedText.text.substring(0, 500)}`,
        schema: {
          type: 'object',
          properties: {
            topics: { type: 'array', items: { type: 'string' } },
            entities: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
            category: { type: 'string' },
            complexity: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        }
      })
      
      // Update document with analysis
      await blink.db.documents.update(documentId, {
        topics: JSON.stringify(analysis.object.topics),
        entities: JSON.stringify(analysis.object.entities),
        summary: analysis.object.summary,
        category: analysis.object.category,
        complexity: analysis.object.complexity,
        processedAt: new Date().toISOString(),
        status: 'processed'
      })
      
      updateStep('analyze', { status: 'completed', progress: 100 })

      onProcessingComplete?.({
        chunks: embeddings.length,
        topics: analysis.object.topics.length,
        entities: analysis.object.entities.length,
        category: analysis.object.category
      })

    } catch (error) {
      console.error('Processing error:', error)
      const currentStep = steps.find(s => s.status === 'processing')
      if (currentStep) {
        updateStep(currentStep.id, { status: 'error', progress: 0 })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const overallProgress = steps.reduce((acc, step) => acc + step.progress, 0) / steps.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Document Processing Pipeline
        </CardTitle>
        <CardDescription>
          AI-powered document analysis and indexing for enhanced search and retrieval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="flex-shrink-0">
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.name}</h4>
                  <Badge variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'processing' ? 'secondary' :
                    step.status === 'error' ? 'destructive' : 'outline'
                  }>
                    {step.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                {step.status === 'processing' && (
                  <Progress value={step.progress} className="h-1 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={processDocument} 
            disabled={isProcessing || !documentId}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Processing
              </>
            )}
          </Button>
        </div>

        {/* Status Alert */}
        {!documentId && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Select a document to begin the AI processing pipeline.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}