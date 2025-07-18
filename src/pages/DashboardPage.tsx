import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { 
  Users, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Target, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { blink } from '../blink/client'

const mockChartData = [
  { name: 'Mon', emails: 45, opens: 32, replies: 8 },
  { name: 'Tue', emails: 52, opens: 38, replies: 12 },
  { name: 'Wed', emails: 48, opens: 35, replies: 9 },
  { name: 'Thu', emails: 61, opens: 44, replies: 15 },
  { name: 'Fri', emails: 55, opens: 41, replies: 11 },
  { name: 'Sat', emails: 23, opens: 18, replies: 4 },
  { name: 'Sun', emails: 18, opens: 14, replies: 3 },
]

const recentActivities = [
  { id: 1, type: 'meeting', message: 'Meeting booked with John Smith from TechCorp', time: '2 hours ago' },
  { id: 2, type: 'reply', message: 'Sarah Johnson replied to your outreach', time: '4 hours ago' },
  { id: 3, type: 'open', message: '15 new email opens from Campaign "SaaS Outreach"', time: '6 hours ago' },
  { id: 4, type: 'lead', message: '25 new leads imported from CSV', time: '1 day ago' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalLeads: 0,
    emailsSent: 0,
    meetingsBooked: 0,
    openRate: 0,
    replyRate: 0,
    leadsUsed: 0,
    leadsLimit: 500,
    trialDaysLeft: 7
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
        
        // Load user stats from database
        const userStats = await blink.db.users.list({
          where: { id: userData.id },
          limit: 1
        })
        
        if (userStats.length > 0) {
          const userRecord = userStats[0]
          setStats(prev => ({
            ...prev,
            leadsUsed: Number(userRecord.leadsUsed) || 0,
            leadsLimit: Number(userRecord.leadsLimit) || 500,
            meetingsBooked: Number(userRecord.meetingsBooked) || 0
          }))
        } else {
          // Create user record if it doesn't exist
          await blink.db.users.create({
            id: userData.id,
            email: userData.email,
            displayName: userData.displayName,
            subscriptionPlan: 'trial',
            subscriptionStatus: 'active',
            leadsUsed: 0,
            leadsLimit: 500,
            meetingsBooked: 0
          })
        }

        // Load campaign stats
        const campaigns = await blink.db.campaigns.list({
          where: { userId: userData.id }
        })
        
        const totalEmailsSent = campaigns.reduce((sum, campaign) => sum + (Number(campaign.emailsSent) || 0), 0)
        const totalOpens = campaigns.reduce((sum, campaign) => sum + (Number(campaign.opens) || 0), 0)
        const totalReplies = campaigns.reduce((sum, campaign) => sum + (Number(campaign.replies) || 0), 0)
        
        setStats(prev => ({
          ...prev,
          totalLeads: campaigns.reduce((sum, campaign) => sum + (Number(campaign.totalLeads) || 0), 0),
          emailsSent: totalEmailsSent,
          openRate: totalEmailsSent > 0 ? Math.round((totalOpens / totalEmailsSent) * 100) : 0,
          replyRate: totalEmailsSent > 0 ? Math.round((totalReplies / totalEmailsSent) * 100) : 0
        }))
        
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const progressPercentage = (stats.leadsUsed / stats.leadsLimit) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your outreach performance and campaign results</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Import Leads
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Trial Status */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-900">Free Trial Active</h3>
              <p className="text-orange-700 mt-1">
                {stats.trialDaysLeft} days remaining • {stats.leadsUsed}/{stats.leadsLimit} leads used
              </p>
            </div>
            <div className="text-right">
              <Progress value={progressPercentage} className="w-32 mb-2" />
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                Upgrade Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% from last week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8% from last week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2.1% from last week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetingsBooked}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +25% from last week
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Performance</CardTitle>
            <CardDescription>Daily email metrics for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="emails" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="replies" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Response rates by campaign type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Cold Email', rate: 12 },
                { name: 'LinkedIn', rate: 8 },
                { name: 'Follow-up', rate: 18 },
                { name: 'Warm Intro', rate: 35 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'meeting' && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === 'reply' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === 'open' && (
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}
                    {activity.type === 'lead' && (
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Import New Leads
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Generate AI Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}