import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Target, 
  Zap, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Plus,
  Eye,
  Send,
  BarChart3
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    leads: { total: 0, verified: 0, highScore: 0 },
    campaigns: { active: 0, total: 0 },
    emails: { sent: 0, opened: 0, replied: 0 },
    meetings: { booked: 0, thisWeek: 0 }
  })
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()

      // Load leads stats
      const dbLeads = await blink.db.leads.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        limit: 5
      })

      // Map database fields to expected format
      const leads = dbLeads.map(lead => ({
        id: lead.id,
        firstName: lead.firstName || lead.first_name || lead.name?.split(' ')[0] || '',
        lastName: lead.lastName || lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        jobTitle: lead.jobTitle || lead.job_title || lead.title || '',
        company: lead.company || lead.company_name || '',
        industry: lead.industry,
        location: lead.location,
        linkedinUrl: lead.linkedinUrl || lead.linkedin_url,
        companyWebsite: lead.companyWebsite || lead.website,
        companySize: lead.companySize || lead.company_size || '',
        leadScore: lead.leadScore || lead.score || 0,
        source: lead.source || 'manual',
        verificationStatus: lead.verificationStatus || lead.status || 'pending',
        lastUpdated: lead.lastUpdated || lead.updated_at || lead.created_at
      }))

      const leadsStats = {
        total: leads.length,
        verified: leads.filter(l => l.verificationStatus === 'verified').length,
        highScore: leads.filter(l => l.leadScore >= 80).length
      }

      // Load campaigns stats
      const campaigns = await blink.db.outreachCampaigns.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 3
      })

      const campaignsStats = {
        active: campaigns.filter(c => c.status === 'active').length,
        total: campaigns.length
      }

      // Load emails stats
      const emails = await blink.db.outreachEmails.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      const emailsStats = {
        sent: emails.filter(e => ['sent', 'delivered', 'opened', 'replied'].includes(e.status)).length,
        opened: emails.filter(e => ['opened', 'replied'].includes(e.status)).length,
        replied: emails.filter(e => e.status === 'replied').length
      }

      // Load meetings stats (placeholder for now)
      const meetingsStats = {
        booked: 12,
        thisWeek: 3
      }

      setStats({
        leads: leadsStats,
        campaigns: campaignsStats,
        emails: emailsStats,
        meetings: meetingsStats
      })

      setRecentLeads(leads.slice(0, 5))
      setRecentCampaigns(campaigns.slice(0, 3))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadDashboardData()
      }
    })
    return unsubscribe
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.displayName || user.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-slate-600">Here's what's happening with your outreach campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/leads')} className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Generate Leads
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="metric-card hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Leads</p>
                <p className="text-2xl font-bold text-slate-900">{stats.leads.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stats.leads.verified} verified
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-slate-900">{stats.campaigns.active}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.campaigns.total} total campaigns
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Target className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Emails Sent</p>
                <p className="text-2xl font-bold text-slate-900">{stats.emails.sent.toLocaleString()}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Eye className="h-3 w-3" />
                  {stats.emails.opened} opened
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover:scale-105 transition-transform duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Meetings Booked</p>
                <p className="text-2xl font-bold text-slate-900">{stats.meetings.booked}</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {stats.meetings.thisWeek} this week
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 metric-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Campaign Performance</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{stats.emails.sent}</div>
                  <div className="text-sm text-slate-600">Emails Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.emails.sent > 0 ? Math.round((stats.emails.opened / stats.emails.sent) * 100) : 0}%
                  </div>
                  <div className="text-sm text-slate-600">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.emails.opened > 0 ? Math.round((stats.emails.replied / stats.emails.opened) * 100) : 0}%
                  </div>
                  <div className="text-sm text-slate-600">Reply Rate</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Email Delivery</span>
                    <span>95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Open Rate</span>
                    <span>{stats.emails.sent > 0 ? Math.round((stats.emails.opened / stats.emails.sent) * 100) : 0}%</span>
                  </div>
                  <Progress 
                    value={stats.emails.sent > 0 ? (stats.emails.opened / stats.emails.sent) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Response Rate</span>
                    <span>{stats.emails.opened > 0 ? Math.round((stats.emails.replied / stats.emails.opened) * 100) : 0}%</span>
                  </div>
                  <Progress 
                    value={stats.emails.opened > 0 ? (stats.emails.replied / stats.emails.opened) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle>Trial Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">5</div>
              <div className="text-sm text-slate-600">Days Remaining</div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Leads Used</span>
                  <span>{stats.leads.total}/500</span>
                </div>
                <Progress value={(stats.leads.total / 500) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Emails Sent</span>
                  <span>{stats.emails.sent}/1000</span>
                </div>
                <Progress value={(stats.emails.sent / 1000) * 100} className="h-2" />
              </div>
            </div>

            <Button className="w-full btn-primary" onClick={() => navigate('/billing')}>
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Leads</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">No leads yet</p>
                <Button onClick={() => navigate('/leads')} className="btn-primary">
                  Generate Your First Leads
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {(lead.firstName || '').charAt(0)}{(lead.lastName || '').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900">
                          {(lead.firstName || '')} {(lead.lastName || '')}
                        </div>
                        <div className="text-sm text-slate-600">{lead.company}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getScoreColor(lead.leadScore)}`}>
                        {lead.leadScore}
                      </div>
                      <div className="text-xs text-slate-500">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Campaigns</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">No campaigns yet</p>
                <Button onClick={() => navigate('/campaigns')} className="btn-primary">
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-slate-900">{campaign.name}</div>
                      <Badge className={`status-badge ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{campaign.leadIds?.length || 0} leads</span>
                      <span>{campaign.stats?.sent || 0} sent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="metric-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/leads')} 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
            >
              <Users className="h-6 w-6" />
              <span>Generate Leads</span>
            </Button>
            <Button 
              onClick={() => navigate('/outreach')} 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
            >
              <Mail className="h-6 w-6" />
              <span>Create Template</span>
            </Button>
            <Button 
              onClick={() => navigate('/campaigns')} 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
            >
              <Send className="h-6 w-6" />
              <span>Start Campaign</span>
            </Button>
            <Button 
              onClick={() => navigate('/calendar')} 
              variant="outline" 
              className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
            >
              <Calendar className="h-6 w-6" />
              <span>View Calendar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}