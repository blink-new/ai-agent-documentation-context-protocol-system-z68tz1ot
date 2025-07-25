import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  FileText, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Database,
  Activity
} from 'lucide-react';
import { blink } from '../blink/client';

interface ProcessingJob {
  id: string;
  documentId: string;
  documentTitle: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  processingTimeMs?: number;
  extractedChunks?: number;
  generatedEmbeddings?: number;
  errorMessage?: string;
}

interface ProcessingStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  totalChunksGenerated: number;
  totalEmbeddingsCreated: number;
}

export function RealtimeProcessingPipeline() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [stats, setStats] = useState<ProcessingStats>({
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProcessingTime: 0,
    totalChunksGenerated: 0,
    totalEmbeddingsCreated: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const loadProcessingJobs = async () => {
    try {
      const user = await blink.auth.me();
      
      // Simulate processing jobs data
      const mockJobs: ProcessingJob[] = [
        {
          id: 'job_1',
          documentId: 'doc_1',
          documentTitle: 'API Documentation',
          status: 'completed',
          progress: 100,
          currentStep: 'Completed',
          startedAt: new Date(Date.now() - 300000).toISOString(),
          completedAt: new Date(Date.now() - 60000).toISOString(),
          processingTimeMs: 240000,
          extractedChunks: 45,
          generatedEmbeddings: 180
        },
        {
          id: 'job_2',
          documentId: 'doc_2',
          documentTitle: 'User Manual',
          status: 'processing',
          progress: 65,
          currentStep: 'Creating vector embeddings...',
          startedAt: new Date(Date.now() - 120000).toISOString(),
          extractedChunks: 32
        }
      ];
      
      setJobs(mockJobs);
      
      // Calculate stats
      const completed = mockJobs.filter(job => job.status === 'completed');
      const failed = mockJobs.filter(job => job.status === 'failed');
      const avgTime = completed.length > 0 
        ? completed.reduce((sum, job) => sum + (job.processingTimeMs || 0), 0) / completed.length
        : 0;
      
      setStats({
        totalJobs: mockJobs.length,
        completedJobs: completed.length,
        failedJobs: failed.length,
        averageProcessingTime: avgTime,
        totalChunksGenerated: completed.reduce((sum, job) => sum + (job.extractedChunks || 0), 0),
        totalEmbeddingsCreated: completed.reduce((sum, job) => sum + (job.generatedEmbeddings || 0), 0)
      });
      
    } catch (error) {
      console.error('Error loading processing jobs:', error);
    }
  };

  const startDocumentProcessing = async () => {
    try {
      setIsProcessing(true);
      
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate processing
      const newJob: ProcessingJob = {
        id: jobId,
        documentId: `doc_${Date.now()}`,
        documentTitle: 'Sample Document',
        status: 'processing',
        progress: 0,
        currentStep: 'Initializing...',
        startedAt: new Date().toISOString()
      };
      
      setJobs(prev => [newJob, ...prev]);
      
      // Simulate processing steps
      const steps = [
        { step: 'Extracting text content...', progress: 20, duration: 2000 },
        { step: 'Analyzing document structure...', progress: 40, duration: 1500 },
        { step: 'Generating semantic chunks...', progress: 60, duration: 3000 },
        { step: 'Creating vector embeddings...', progress: 80, duration: 2500 },
        { step: 'Indexing for search...', progress: 95, duration: 1000 },
        { step: 'Completed', progress: 100, duration: 500 }
      ];
      
      for (const { step, progress, duration } of steps) {
        await new Promise(resolve => setTimeout(resolve, duration));
        
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? {
                ...job,
                status: progress === 100 ? 'completed' : 'processing',
                progress,
                currentStep: step,
                ...(progress === 100 && {
                  completedAt: new Date().toISOString(),
                  processingTimeMs: Date.now() - new Date(job.startedAt).getTime(),
                  extractedChunks: Math.floor(Math.random() * 50) + 10,
                  generatedEmbeddings: Math.floor(Math.random() * 200) + 50
                })
              }
            : job
        ));
      }
      
      // Refresh stats
      await loadProcessingJobs();
      
    } catch (error) {
      console.error('Error starting document processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const retryFailedJob = async (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'queued', progress: 0, currentStep: 'Retrying...', errorMessage: undefined }
        : job
    ));
  };

  useEffect(() => {
    loadProcessingJobs();
    
    // Set up real-time updates
    const interval = setInterval(loadProcessingJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Real-time Processing Pipeline</h2>
        <p className="text-gray-600">Monitor AI-powered document processing and indexing</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedJobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedJobs}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.averageProcessingTime / 1000)}s
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chunks</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalChunksGenerated}</p>
              </div>
              <Database className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Embeddings</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalEmbeddingsCreated}</p>
              </div>
              <Brain className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Start New Processing Job</span>
          </CardTitle>
          <CardDescription>
            Process documents for AI-powered semantic search and context retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={startDocumentProcessing}
              disabled={isProcessing}
              className="flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Process Sample Document</span>
                </>
              )}
            </Button>
            
            <Alert className="flex-1">
              <Brain className="h-4 w-4" />
              <AlertDescription>
                AI processing includes text extraction, semantic chunking, vector embedding generation, and search indexing.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Processing Jobs</span>
          </CardTitle>
          <CardDescription>
            Real-time status of document processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No processing jobs found</p>
                <p className="text-sm">Start processing a document to see jobs here</p>
              </div>
            ) : (
              jobs.map(job => (
                <Card key={job.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {job.documentTitle || `Document ${job.documentId.slice(-8)}`}
                          </h4>
                          <p className="text-sm text-gray-600">{job.currentStep}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryFailedJob(job.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>

                    {job.status === 'processing' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <div className="font-medium">
                          {new Date(job.startedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {job.completedAt && (
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <div className="font-medium">
                            {new Date(job.completedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                      
                      {job.processingTimeMs && (
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div className="font-medium">
                            {Math.round(job.processingTimeMs / 1000)}s
                          </div>
                        </div>
                      )}
                      
                      {job.extractedChunks && (
                        <div>
                          <span className="text-gray-500">Chunks:</span>
                          <div className="font-medium">{job.extractedChunks}</div>
                        </div>
                      )}
                    </div>

                    {job.errorMessage && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-600">
                          {job.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Processing Efficiency</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>{stats.totalJobs > 0 ? 
                    ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Chunks per Document</span>
                  <span>{stats.completedJobs > 0 ? 
                    Math.round(stats.totalChunksGenerated / stats.completedJobs) : 0}</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">AI Processing Metrics</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Embeddings per Chunk</span>
                  <span>{stats.totalChunksGenerated > 0 ? 
                    Math.round(stats.totalEmbeddingsCreated / stats.totalChunksGenerated) : 0}</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Speed</span>
                  <span>{stats.averageProcessingTime > 0 ? 
                    Math.round(1000 / (stats.averageProcessingTime / 1000)) : 0} docs/min</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}