import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Upload,
  FileCode,
  FileImage,
  File,
  Brain,
  Users
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Document } from '@/types'
import { DocumentProcessor } from '@/components/DocumentProcessor'
import { CollaborationHub } from '@/components/CollaborationHub'
import { RealtimeProcessingPipeline } from '@/components/RealtimeProcessingPipeline'
import { ContextRecommendationEngine } from '@/components/ContextRecommendationEngine'

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [activeTab, setActiveTab] = useState('library')

  // Form state for adding documents
  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    format: 'markdown' as const,
    category: '',
    subcategory: '',
    tags: ''
  })

  const loadDocuments = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.documents.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setDocuments(data)
      setFilteredDocuments(data)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  // Filter documents based on search and filters
  useEffect(() => {
    let filtered = documents

    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedFormat !== 'all') {
      filtered = filtered.filter(doc => doc.format === selectedFormat)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory)
    }

    setFilteredDocuments(filtered)
  }, [documents, searchQuery, selectedFormat, selectedCategory])

  const handleAddDocument = async () => {
    try {
      const user = await blink.auth.me()
      const documentId = `doc_${Date.now()}`
      
      await blink.db.documents.create({
        id: documentId,
        title: newDocument.title,
        content: newDocument.content,
        format: newDocument.format,
        category: newDocument.category,
        subcategory: newDocument.subcategory || undefined,
        tags: newDocument.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        version: 1,
        status: 'active',
        relevance_score: 0.8,
        user_id: user.id
      })

      // Reset form
      setNewDocument({
        title: '',
        content: '',
        format: 'markdown',
        category: '',
        subcategory: '',
        tags: ''
      })
      setIsAddDialogOpen(false)
      loadDocuments()
    } catch (error) {
      console.error('Error adding document:', error)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await blink.db.documents.delete(documentId)
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'markdown':
        return <FileText className="h-4 w-4" />
      case 'html':
        return <FileCode className="h-4 w-4" />
      case 'json':
        return <FileCode className="h-4 w-4" />
      case 'pdf':
        return <File className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'markdown':
        return 'bg-blue-100 text-blue-800'
      case 'html':
        return 'bg-orange-100 text-orange-800'
      case 'json':
        return 'bg-green-100 text-green-800'
      case 'pdf':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Library</h1>
          <p className="text-muted-foreground">
            Manage your knowledge base and documentation
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>
                Create a new document in your knowledge base
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="Document title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={newDocument.format}
                    onValueChange={(value: any) => setNewDocument({ ...newDocument, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newDocument.category}
                    onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                    placeholder="e.g., API Documentation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={newDocument.subcategory}
                    onChange={(e) => setNewDocument({ ...newDocument, subcategory: e.target.value })}
                    placeholder="e.g., Authentication"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={newDocument.tags}
                  onChange={(e) => setNewDocument({ ...newDocument, tags: e.target.value })}
                  placeholder="Comma-separated tags"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  placeholder="Document content..."
                  rows={8}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDocument}>
                  Add Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="library">
            <FileText className="h-4 w-4 mr-2" />
            Library
          </TabsTrigger>
          <TabsTrigger value="processing">
            <Brain className="h-4 w-4 mr-2" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="collaboration">
            <Users className="h-4 w-4 mr-2" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            AI Pipeline
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <Card 
            key={document.id} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              selectedDocument?.id === document.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedDocument(document)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getFormatIcon(document.format)}
                  <CardTitle className="text-lg line-clamp-1">{document.title}</CardTitle>
                </div>
                <Badge className={getFormatColor(document.format)}>
                  {document.format}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {document.content.substring(0, 100)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{document.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">v{document.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Relevance</span>
                  <span className="font-medium">{(document.relevance_score * 100).toFixed(1)}%</span>
                </div>
                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{document.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {documents.length === 0
                ? "Start building your knowledge base by adding your first document."
                : "Try adjusting your search criteria or filters."}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <DocumentProcessor 
            documentId={selectedDocument?.id}
            onProcessingComplete={(result) => {
              console.log('Processing completed:', result)
              loadDocuments() // Refresh documents
            }}
          />
          
          {!selectedDocument && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Document</h3>
                <p className="text-muted-foreground text-center">
                  Choose a document from the library to start AI processing.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          {selectedDocument ? (
            <CollaborationHub documentId={selectedDocument.id} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Document</h3>
                <p className="text-muted-foreground text-center">
                  Choose a document from the library to view collaboration features.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Documents</span>
                    <span className="font-semibold">{documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed Documents</span>
                    <span className="font-semibold">
                      {documents.filter(d => d.status === 'processed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories</span>
                    <span className="font-semibold">{categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Relevance</span>
                    <span className="font-semibold">
                      {documents.length > 0 
                        ? (documents.reduce((acc, doc) => acc + doc.relevance_score, 0) / documents.length * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['markdown', 'html', 'json', 'pdf'].map(format => {
                    const count = documents.filter(d => d.format === format).length
                    const percentage = documents.length > 0 ? (count / documents.length * 100) : 0
                    return (
                      <div key={format} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{format}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <RealtimeProcessingPipeline />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <ContextRecommendationEngine />
        </TabsContent>
      </Tabs>
    </div>
  )
}