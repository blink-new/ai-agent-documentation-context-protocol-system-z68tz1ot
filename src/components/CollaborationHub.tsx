import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, MessageSquare, Edit3, Eye, Clock, Send, Plus } from 'lucide-react'
import { blink } from '@/blink/client'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string
  resolved: boolean
  replies: Comment[]
}

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'editing'
  lastSeen: string
  role: 'viewer' | 'editor' | 'admin'
}

interface CollaborationHubProps {
  documentId: string
}

export function CollaborationHub({ documentId }: CollaborationHubProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [activeUsers, setActiveUsers] = useState<string[]>([])

  const loadCollaborationData = useCallback(async () => {
    try {
      // Load collaborators
      const collaboratorsData = await blink.db.documentCollaborators.list({
        where: { documentId },
        orderBy: { lastSeen: 'desc' }
      })

      const mockCollaborators: Collaborator[] = [
        {
          id: 'user_1',
          name: 'Alice Johnson',
          email: 'alice@company.com',
          avatar: '/avatars/alice.jpg',
          status: 'online',
          lastSeen: new Date().toISOString(),
          role: 'admin'
        },
        {
          id: 'user_2',
          name: 'Bob Smith',
          email: 'bob@company.com',
          avatar: '/avatars/bob.jpg',
          status: 'editing',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          role: 'editor'
        },
        {
          id: 'user_3',
          name: 'Carol Davis',
          email: 'carol@company.com',
          status: 'offline',
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          role: 'viewer'
        }
      ]

      setCollaborators(mockCollaborators)

      // Load comments
      const commentsData = await blink.db.documentComments.list({
        where: { documentId },
        orderBy: { createdAt: 'desc' }
      })

      const mockComments: Comment[] = [
        {
          id: 'comment_1',
          content: 'This section needs more detail about error handling. Should we add examples?',
          author: {
            id: 'user_1',
            name: 'Alice Johnson',
            avatar: '/avatars/alice.jpg'
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          resolved: false,
          replies: [
            {
              id: 'reply_1',
              content: 'Good point! I\'ll add some code examples in the next revision.',
              author: {
                id: 'user_2',
                name: 'Bob Smith',
                avatar: '/avatars/bob.jpg'
              },
              timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              resolved: false,
              replies: []
            }
          ]
        },
        {
          id: 'comment_2',
          content: 'The API endpoint documentation looks comprehensive. Great work!',
          author: {
            id: 'user_3',
            name: 'Carol Davis'
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          replies: []
        }
      ]

      setComments(mockComments)

    } catch (error) {
      console.error('Error loading collaboration data:', error)
    }
  }, [documentId])

  const setupRealtimeCollaboration = useCallback(async () => {
    try {
      // Subscribe to document collaboration channel
      const channel = blink.realtime.channel(`doc_${documentId}`)
      
      await channel.subscribe({
        userId: 'current_user',
        metadata: { 
          documentId,
          action: 'viewing'
        }
      })

      // Listen for real-time updates
      channel.onMessage((message) => {
        if (message.type === 'user_joined') {
          setActiveUsers(prev => [...prev, message.data.userId])
        } else if (message.type === 'user_left') {
          setActiveUsers(prev => prev.filter(id => id !== message.data.userId))
        } else if (message.type === 'comment_added') {
          setComments(prev => [message.data.comment, ...prev])
        } else if (message.type === 'editing_started') {
          setCollaborators(prev => prev.map(c => 
            c.id === message.data.userId 
              ? { ...c, status: 'editing' as const }
              : c
          ))
        }
      })

      // Get current presence
      const presence = await channel.getPresence()
      setActiveUsers(presence.map(p => p.userId))

    } catch (error) {
      console.error('Error setting up realtime collaboration:', error)
    }
  }, [documentId])

  useEffect(() => {
    loadCollaborationData()
    setupRealtimeCollaboration()
  }, [documentId, loadCollaborationData, setupRealtimeCollaboration])

  const addComment = async () => {
    if (!newComment.trim()) return

    setIsAddingComment(true)
    
    try {
      const comment: Comment = {
        id: `comment_${Date.now()}`,
        content: newComment,
        author: {
          id: 'current_user',
          name: 'Current User',
          avatar: '/avatars/current.jpg'
        },
        timestamp: new Date().toISOString(),
        resolved: false,
        replies: []
      }

      // Add to database
      await blink.db.documentComments.create({
        id: comment.id,
        documentId,
        content: comment.content,
        authorId: comment.author.id,
        authorName: comment.author.name,
        createdAt: comment.timestamp,
        resolved: comment.resolved ? '1' : '0',
        userId: 'current_user'
      })

      // Broadcast to other users
      await blink.realtime.publish(`doc_${documentId}`, 'comment_added', {
        comment
      })

      setComments(prev => [comment, ...prev])
      setNewComment('')

    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsAddingComment(false)
    }
  }

  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'editing':
        return 'bg-blue-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getRoleColor = (role: Collaborator['role']) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'editor':
        return 'default'
      case 'viewer':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Active Collaborators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Collaborators ({collaborators.filter(c => c.status !== 'offline').length})
          </CardTitle>
          <CardDescription>
            Real-time collaboration and document editing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collaborator.avatar} />
                      <AvatarFallback>
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{collaborator.name}</p>
                    <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleColor(collaborator.role)}>
                    {collaborator.role}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {collaborator.status === 'editing' && <Edit3 className="h-3 w-3" />}
                    {collaborator.status === 'online' && collaborator.status !== 'editing' && <Eye className="h-3 w-3" />}
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(collaborator.lastSeen)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments & Discussions ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Comment */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Textarea
              placeholder="Add a comment or question..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={addComment} 
                disabled={!newComment.trim() || isAddingComment}
                size="sm"
              >
                {isAddingComment ? (
                  <>
                    <Send className="h-4 w-4 mr-2 animate-pulse" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Comments List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  <div className={`p-4 rounded-lg border ${comment.resolved ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback className="text-xs">
                            {comment.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>
                      
                      {comment.resolved && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm">{comment.content}</p>
                    
                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="mt-3 ml-6 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="p-2 rounded border-l-2 border-blue-200 bg-blue-50">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback className="text-xs">
                                  {reply.author.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs">{reply.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(reply.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}