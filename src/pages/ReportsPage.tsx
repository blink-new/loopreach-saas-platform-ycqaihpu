import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Users, 
  Calendar, 
  Target,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MessageSquare
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface CampaignStats {
  id: string
  name: string
  emailsSent: number
  opens: number
  replies: number
  meetingsBooked: number
  createdAt: string
}

interface DailyStats {
  date: string
  emailsSent: number
  opens: number
  replies: number
  meetings: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ReportsPage() {
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [selectedMetric, setSelectedMetric] = useState('emails')

  const { toast } = useToast()

  const loadReportsData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load campaign data
      const campaignsData = await blink.db.campaigns.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setCampaigns(campaignsData)

      // Generate mock daily stats for the chart
      const days = parseInt(timeRange)
      const mockDailyStats: DailyStats[] = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        const baseEmails = Math.floor(Math.random() * 50) + 20
        const opens = Math.floor(baseEmails * (0.25 + Math.random() * 0.15)) // 25-40% open rate
        const replies = Math.floor(opens * (0.1 + Math.random() * 0.1)) // 10-20% reply rate
        const meetings = Math.floor(replies * (0.3 + Math.random() * 0.2)) // 30-50% meeting rate
        
        mockDailyStats.push({
          date: date.toISOString().split('T')[0],
          emailsSent: baseEmails,
          opens,
          replies,
          meetings
        })
      }
      
      setDailyStats(mockDailyStats)

    } catch (error) {
      console.error('Error loading reports data:', error)
      toast({
        title: "Error",
        description: "Failed to load reports data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportsData()
  }, [timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const calculateTotalStats = () => {
    const totalEmailsSent = campaigns.reduce((sum, c) => sum + (Number(c.emailsSent) || 0), 0)
    const totalOpens = campaigns.reduce((sum, c) => sum + (Number(c.opens) || 0), 0)
    const totalReplies = campaigns.reduce((sum, c) => sum + (Number(c.replies) || 0), 0)
    const totalMeetings = campaigns.reduce((sum, c) => sum + (Number(c.meetingsBooked) || 0), 0)

    const openRate = totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0
    const replyRate = totalEmailsSent > 0 ? (totalReplies / totalEmailsSent) * 100 : 0
    const meetingRate = totalReplies > 0 ? (totalMeetings / totalReplies) * 100 : 0

    return {
      totalEmailsSent,
      totalOpens,
      totalReplies,
      totalMeetings,
      openRate,
      replyRate,
      meetingRate
    }
  }

  const stats = calculateTotalStats()

  const campaignPerformanceData = campaigns.map(campaign => ({
    name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name,
    fullName: campaign.name,
    emails: Number(campaign.emailsSent) || 0,
    opens: Number(campaign.opens) || 0,
    replies: Number(campaign.replies) || 0,
    meetings: Number(campaign.meetingsBooked) || 0,
    openRate: campaign.emailsSent > 0 ? ((campaign.opens / campaign.emailsSent) * 100).toFixed(1) : '0',
    replyRate: campaign.emailsSent > 0 ? ((campaign.replies / campaign.emailsSent) * 100).toFixed(1) : '0'
  }))

  const conversionFunnelData = [
    { name: 'Emails Sent', value: stats.totalEmailsSent, color: '#3b82f6' },
    { name: 'Opened', value: stats.totalOpens, color: '#10b981' },
    { name: 'Replied', value: stats.totalReplies, color: '#f59e0b' },
    { name: 'Meetings', value: stats.totalMeetings, color: '#ef4444' }
  ]

  const exportReport = () => {
    const reportData = {
      summary: stats,
      campaigns: campaignPerformanceData,
      dailyStats,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loopreach-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Report Exported",
      description: "Your report has been downloaded successfully."
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your outreach performance and campaign results</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% from last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +2.1% from last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.replyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -0.5% from last period
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
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +25% from last period
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Daily metrics for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                />
                <Area 
                  type="monotone" 
                  dataKey="emailsSent" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Emails Sent"
                />
                <Area 
                  type="monotone" 
                  dataKey="opens" 
                  stackId="2"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Opens"
                />
                <Area 
                  type="monotone" 
                  dataKey="replies" 
                  stackId="3"
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.6}
                  name="Replies"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>How leads progress through your funnel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnelData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Breakdown</CardTitle>
              <CardDescription>
                Detailed metrics for each of your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => {
                      const campaign = campaignPerformanceData.find(c => c.name === label)
                      return campaign?.fullName || label
                    }}
                  />
                  <Bar dataKey="emails" fill="#3b82f6" name="Emails Sent" />
                  <Bar dataKey="opens" fill="#10b981" name="Opens" />
                  <Bar dataKey="replies" fill="#f59e0b" name="Replies" />
                  <Bar dataKey="meetings" fill="#ef4444" name="Meetings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Open Rate Trends</CardTitle>
                <CardDescription>How your open rates have changed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value, name) => [
                        `${((value as number / dailyStats.find(d => d.date === name)?.emailsSent || 1) * 100).toFixed(1)}%`,
                        'Open Rate'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="opens" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reply Rate Trends</CardTitle>
                <CardDescription>Track your reply rate performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value, name) => [
                        `${((value as number / dailyStats.find(d => d.date === name)?.emailsSent || 1) * 100).toFixed(1)}%`,
                        'Reply Rate'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="replies" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>AI-powered analysis of your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-900">Strong Open Rates</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your average open rate of {stats.openRate.toFixed(1)}% is above industry average (21%). 
                        Your subject lines are performing well.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <Target className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Reply Rate Opportunity</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your reply rate of {stats.replyRate.toFixed(1)}% could be improved. 
                        Consider A/B testing different email content and personalization.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Meeting Conversion</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {stats.meetingRate.toFixed(1)}% of replies convert to meetings. 
                        This is excellent - keep using your current meeting booking approach.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable steps to improve performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Optimize Send Times</h4>
                      <p className="text-sm text-gray-600">
                        Try sending emails on Tuesday-Thursday between 10-11 AM for better open rates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Improve Personalization</h4>
                      <p className="text-sm text-gray-600">
                        Add more specific details about the prospect's company or recent news to increase replies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Follow-up Sequence</h4>
                      <p className="text-sm text-gray-600">
                        Add a 3rd follow-up email to your sequences - many replies come from the 3rd touch.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">A/B Test CTAs</h4>
                      <p className="text-sm text-gray-600">
                        Test different call-to-action phrases to see what drives more meeting bookings.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}