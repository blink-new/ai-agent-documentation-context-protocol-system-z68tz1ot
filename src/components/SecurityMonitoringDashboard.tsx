import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Key,
  Activity,
  Globe,
  Clock,
  User,
  Database,
  FileText,
  Zap,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { blink } from '../blink/client';

interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'api_abuse' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  agentId?: string;
  agentName?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
  details: Record<string, any>;
}

interface AccessLog {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  documentId?: string;
  queryText?: string;
  success: boolean;
}

interface SecurityMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uniqueAgents: number;
  averageResponseTime: number;
  securityEvents: number;
  criticalEvents: number;
  blockedRequests: number;
}

interface ThreatIntelligence {
  id: string;
  type: 'ip_reputation' | 'pattern_analysis' | 'anomaly_detection' | 'rate_limiting';
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  recommendation: string;
  affectedAgents: string[];
  detectedAt: string;
}

export function SecurityMonitoringDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    uniqueAgents: 0,
    averageResponseTime: 0,
    securityEvents: 0,
    criticalEvents: 0,
    blockedRequests: 0
  });
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Mock security events
      const mockEvents: SecurityEvent[] = [
        {
          id: 'event_1',
          type: 'authentication',
          severity: 'high',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          agentId: 'agent_suspicious',
          agentName: 'Unknown Agent',
          description: 'Multiple failed authentication attempts detected',
          ipAddress: '192.168.1.100',
          userAgent: 'curl/7.68.0',
          resolved: false,
          details: {
            attemptCount: 15,
            timeWindow: '5 minutes',
            lastAttempt: new Date().toISOString()
          }
        },
        {
          id: 'event_2',
          type: 'api_abuse',
          severity: 'medium',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          agentId: 'agent_rate_limited',
          agentName: 'Bulk Processor',
          description: 'Rate limit exceeded - 1000 requests in 1 minute',
          ipAddress: '10.0.0.50',
          userAgent: 'Python/3.9 requests/2.25.1',
          resolved: true,
          details: {
            requestCount: 1000,
            timeWindow: '1 minute',
            rateLimitThreshold: 100
          }
        },
        {
          id: 'event_3',
          type: 'suspicious_activity',
          severity: 'critical',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          agentId: 'agent_anomaly',
          agentName: 'Data Scraper',
          description: 'Unusual data access pattern detected',
          ipAddress: '203.0.113.42',
          userAgent: 'Mozilla/5.0 (compatible; Bot/1.0)',
          resolved: false,
          details: {
            documentsAccessed: 500,
            timeWindow: '10 minutes',
            normalPattern: '5-10 documents per hour'
          }
        }
      ];
      
      setSecurityEvents(mockEvents);
      
      // Mock access logs
      const mockLogs: AccessLog[] = [
        {
          id: 'log_1',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          agentId: 'agent_1',
          agentName: 'Documentation Bot',
          endpoint: '/api/query',
          method: 'POST',
          statusCode: 200,
          responseTime: 245,
          ipAddress: '192.168.1.10',
          documentId: 'doc_123',
          queryText: 'API authentication methods',
          success: true
        },
        {
          id: 'log_2',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          agentId: 'agent_2',
          agentName: 'Support Assistant',
          endpoint: '/api/feedback',
          method: 'POST',
          statusCode: 201,
          responseTime: 156,
          ipAddress: '192.168.1.20',
          success: true
        },
        {
          id: 'log_3',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          agentId: 'agent_suspicious',
          agentName: 'Unknown Agent',
          endpoint: '/api/query',
          method: 'POST',
          statusCode: 401,
          responseTime: 50,
          ipAddress: '192.168.1.100',
          success: false
        }
      ];
      
      setAccessLogs(mockLogs);
      
      // Calculate metrics
      const totalRequests = mockLogs.length;
      const successfulRequests = mockLogs.filter(log => log.success).length;
      const failedRequests = totalRequests - successfulRequests;
      const uniqueAgents = new Set(mockLogs.map(log => log.agentId)).size;
      const averageResponseTime = mockLogs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests;
      const securityEvents = mockEvents.length;
      const criticalEvents = mockEvents.filter(event => event.severity === 'critical').length;
      
      setMetrics({
        totalRequests,
        successfulRequests,
        failedRequests,
        uniqueAgents,
        averageResponseTime,
        securityEvents,
        criticalEvents,
        blockedRequests: 5
      });
      
      // Mock threat intelligence
      const mockThreats: ThreatIntelligence[] = [
        {
          id: 'threat_1',
          type: 'ip_reputation',
          title: 'Suspicious IP Address Detected',
          description: 'IP 203.0.113.42 flagged in threat intelligence feeds',
          riskLevel: 'high',
          confidence: 0.85,
          recommendation: 'Block IP address and review all recent activity',
          affectedAgents: ['agent_anomaly'],
          detectedAt: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: 'threat_2',
          type: 'pattern_analysis',
          title: 'Abnormal Query Patterns',
          description: 'Detected queries targeting sensitive documentation sections',
          riskLevel: 'medium',
          confidence: 0.72,
          recommendation: 'Monitor agent behavior and implement additional access controls',
          affectedAgents: ['agent_suspicious', 'agent_anomaly'],
          detectedAt: new Date(Date.now() - 1200000).toISOString()
        },
        {
          id: 'threat_3',
          type: 'anomaly_detection',
          title: 'Unusual Access Time Pattern',
          description: 'High volume of requests during off-hours (2-4 AM)',
          riskLevel: 'low',
          confidence: 0.68,
          recommendation: 'Review legitimate use cases for off-hours access',
          affectedAgents: ['agent_night_crawler'],
          detectedAt: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      
      setThreats(mockThreats);
      
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveSecurityEvent = async (eventId: string) => {
    setSecurityEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, resolved: true }
        : event
    ));
  };

  const blockAgent = async (agentId: string) => {
    console.log(`Blocking agent: ${agentId}`);
    // In a real implementation, this would add the agent to a blocklist
  };

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time updates
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'authentication':
        return <Key className="h-4 w-4" />;
      case 'authorization':
        return <Lock className="h-4 w-4" />;
      case 'data_access':
        return <Database className="h-4 w-4" />;
      case 'api_abuse':
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security & Monitoring Dashboard</h2>
        <p className="text-gray-600">Real-time security monitoring and threat detection</p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.totalRequests > 0 ? 
                    ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.securityEvents}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Security Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Security Events</span>
              </CardTitle>
              <CardDescription>
                Real-time security events and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map(event => (
                  <Card key={event.id} className={`border-l-4 ${
                    event.severity === 'critical' ? 'border-l-red-500' :
                    event.severity === 'high' ? 'border-l-orange-500' :
                    event.severity === 'medium' ? 'border-l-yellow-500' :
                    'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getEventIcon(event.type)}
                          <div>
                            <h4 className="font-medium text-gray-900">{event.description}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getSeverityColor(event.severity)}>
                                {event.severity}
                              </Badge>
                              <Badge variant="outline">{event.type}</Badge>
                              {event.resolved ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {!event.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveSecurityEvent(event.id)}
                            >
                              Resolve
                            </Button>
                          )}
                          {event.agentId && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => blockAgent(event.agentId!)}
                            >
                              Block Agent
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <div className="font-medium">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">IP Address:</span>
                          <div className="font-medium font-mono">{event.ipAddress}</div>
                        </div>
                        
                        {event.agentName && (
                          <div>
                            <span className="text-gray-500">Agent:</span>
                            <div className="font-medium">{event.agentName}</div>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-gray-500">User Agent:</span>
                          <div className="font-medium truncate">{event.userAgent}</div>
                        </div>
                      </div>
                      
                      {Object.keys(event.details).length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium mb-2">Event Details</h5>
                          <div className="text-sm space-y-1">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {securityEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No security events detected</p>
                    <p className="text-sm">Your system is secure</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Access Logs</span>
              </CardTitle>
              <CardDescription>
                Recent API access logs and requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accessLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        log.success ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.agentName}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.method}
                          </Badge>
                          <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                            {log.statusCode}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {log.endpoint} • {log.ipAddress}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      <div className="font-medium">{log.responseTime}ms</div>
                      <div className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threat Intelligence */}
        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Threat Intelligence</span>
              </CardTitle>
              <CardDescription>
                AI-powered threat detection and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threats.map(threat => (
                  <Card key={threat.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{threat.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{threat.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskColor(threat.riskLevel)}>
                            {threat.riskLevel} risk
                          </Badge>
                          <Badge variant="outline">
                            {(threat.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Type:</span>
                          <div className="font-medium">{threat.type.replace(/_/g, ' ')}</div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-500">Detected:</span>
                          <div className="font-medium">
                            {new Date(threat.detectedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommendation:</strong> {threat.recommendation}
                        </AlertDescription>
                      </Alert>
                      
                      {threat.affectedAgents.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-500">Affected Agents:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {threat.affectedAgents.map(agentId => (
                              <Badge key={agentId} variant="outline" className="text-xs">
                                {agentId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Security Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Request Success Rate</span>
                    <span>{metrics.totalRequests > 0 ? 
                      ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <Progress value={metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Average Response Time</span>
                    <span>{Math.round(metrics.averageResponseTime)}ms</span>
                  </div>
                  <Progress value={Math.min((metrics.averageResponseTime / 1000) * 100, 100)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Security Score</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Threat Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">↓ 23%</div>
                  <div className="text-sm text-gray-600">Security incidents this week</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">↑ 15%</div>
                  <div className="text-sm text-gray-600">Blocked threats</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">98.5%</div>
                  <div className="text-sm text-gray-600">System uptime</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}