import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Crown, 
  Zap,
  Users,
  Mail,
  Target,
  BarChart3,
  ExternalLink,
  Download
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface UserSubscription {
  id: string
  subscriptionPlan: 'trial' | 'growth' | 'enterprise'
  subscriptionStatus: 'active' | 'cancelled' | 'past_due'
  leadsUsed: number
  leadsLimit: number
  trialStartDate: string
  trialEndDate: string
}

interface UsageStats {
  emailsSent: number
  meetingsBooked: number
  campaignsActive: number
}

export default function BillingPage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<UsageStats>({ emailsSent: 0, meetingsBooked: 0, campaignsActive: 0 })
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    loadBillingData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBillingData = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
      
      // Load user subscription data
      const userRecord = await blink.db.users.list({
        where: { id: userData.id },
        limit: 1
      })
      
      if (userRecord.length > 0) {
        setSubscription(userRecord[0] as UserSubscription)
      }

      // Load usage statistics
      const campaigns = await blink.db.campaigns.list({
        where: { userId: userData.id }
      })

      const totalEmailsSent = campaigns.reduce((sum, c) => sum + (Number(c.emailsSent) || 0), 0)
      const totalMeetings = campaigns.reduce((sum, c) => sum + (Number(c.meetingsBooked) || 0), 0)
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length

      setUsage({
        emailsSent: totalEmailsSent,
        meetingsBooked: totalMeetings,
        campaignsActive: activeCampaigns
      })

    } catch (error) {
      console.error('Error loading billing data:', error)
      toast({
        title: "Error",
        description: "Failed to load billing information. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = (plan: 'growth' | 'enterprise') => {
    // In a real app, this would redirect to Stripe Checkout
    toast({
      title: "Upgrade Coming Soon",
      description: `${plan} plan upgrade will be available soon. Contact support for early access.`,
    })
  }

  const handleManageBilling = () => {
    // In a real app, this would redirect to Stripe Customer Portal
    toast({
      title: "Billing Portal",
      description: "Billing management portal will be available soon.",
    })
  }

  const calculateTrialDaysLeft = () => {
    if (!subscription?.trialEndDate) return 0
    const endDate = new Date(subscription.trialEndDate)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getUsagePercentage = () => {
    if (!subscription) return 0
    return (subscription.leadsUsed / subscription.leadsLimit) * 100
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      trial: <Badge className="bg-orange-100 text-orange-800">Free Trial</Badge>,
      growth: <Badge className="bg-blue-100 text-blue-800">Growth Plan</Badge>,
      enterprise: <Badge className="bg-purple-100 text-purple-800">Enterprise Plan</Badge>
    }
    return badges[plan as keyof typeof badges] || badges.trial
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>,
      cancelled: <Badge className="bg-red-100 text-red-800">Cancelled</Badge>,
      past_due: <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Past Due</Badge>
    }
    return badges[status as keyof typeof badges] || badges.active
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const trialDaysLeft = calculateTrialDaysLeft()
  const usagePercentage = getUsagePercentage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and track usage</p>
        </div>
        <Button variant="outline" onClick={handleManageBilling}>
          <CreditCard className="h-4 w-4 mr-2" />
          Manage Billing
        </Button>
      </div>

      {/* Current Plan */}
      <Card className={subscription?.subscriptionPlan === 'trial' ? 'border-orange-200 bg-orange-50' : ''}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {subscription && getPlanBadge(subscription.subscriptionPlan)}
              </CardTitle>
              <CardDescription>
                {subscription?.subscriptionPlan === 'trial' 
                  ? `${trialDaysLeft} days remaining in your free trial`
                  : 'Your active subscription details'
                }
              </CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.subscriptionStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Lead Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{subscription?.leadsUsed || 0} used</span>
                  <span>{subscription?.leadsLimit || 500} limit</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-gray-500">
                  {subscription?.leadsLimit && subscription.leadsUsed 
                    ? (subscription.leadsLimit - subscription.leadsUsed) 
                    : subscription?.leadsLimit || 500
                  } leads remaining
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">This Month</h4>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {usage.emailsSent} emails sent
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {usage.meetingsBooked} meetings booked
                </div>
                <div className="flex items-center text-sm">
                  <Target className="h-4 w-4 mr-2 text-gray-400" />
                  {usage.campaignsActive} active campaigns
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                {subscription?.subscriptionPlan === 'trial' && (
                  <Button size="sm" onClick={() => handleUpgrade('growth')} className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Plan */}
        <Card className="border-2 border-blue-200 relative">
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
            Most Popular
          </Badge>
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              Growth Plan
            </CardTitle>
            <div className="text-4xl font-bold text-gray-900 mt-4">
              $49<span className="text-lg font-normal text-gray-600">/month</span>
            </div>
            <CardDescription className="text-lg mt-2">
              Perfect for growing teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                10,000 verified leads/month
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                6 guaranteed meetings/month
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                AI-powered cold emails & LinkedIn
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                Live dashboard & analytics
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                Weekly reports
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                CRM-compatible CSV export
              </li>
            </ul>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => handleUpgrade('growth')}
              disabled={subscription?.subscriptionPlan === 'growth'}
            >
              {subscription?.subscriptionPlan === 'growth' ? 'Current Plan' : 'Upgrade to Growth'}
            </Button>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="border-2 hover:border-purple-200 transition-colors">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-purple-600" />
              Enterprise Plan
            </CardTitle>
            <div className="text-4xl font-bold text-gray-900 mt-4">
              $119<span className="text-lg font-normal text-gray-600">/month</span>
            </div>
            <CardDescription className="text-lg mt-2">
              For high-volume outreach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                Everything in Growth, plus:
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                15,000 verified leads/month
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                20 guaranteed meetings/month
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                Dedicated Account Manager
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                A/B tested campaigns
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                Native CRM integrations
              </li>
            </ul>
            <Button 
              variant={subscription?.subscriptionPlan === 'enterprise' ? 'secondary' : 'outline'} 
              className="w-full" 
              size="lg" 
              onClick={() => handleUpgrade('enterprise')}
              disabled={subscription?.subscriptionPlan === 'enterprise'}
            >
              {subscription?.subscriptionPlan === 'enterprise' ? 'Current Plan' : 'Upgrade to Enterprise'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads This Month</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscription?.leadsUsed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {subscription?.leadsLimit || 500} limit
                </p>
                <Progress value={usagePercentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage.emailsSent}</div>
                <p className="text-xs text-muted-foreground">
                  This billing period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usage.meetingsBooked}</div>
                <p className="text-xs text-muted-foreground">
                  This billing period
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Your payment history and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No billing history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your billing history will appear here once you upgrade to a paid plan.
                </p>
                <div className="mt-6">
                  <Button onClick={() => handleUpgrade('growth')}>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trial Warning */}
      {subscription?.subscriptionPlan === 'trial' && trialDaysLeft <= 3 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4 flex-1">
                <h3 className="font-semibold text-red-900">Trial Ending Soon</h3>
                <p className="text-red-700 mt-1">
                  Your free trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}. 
                  Upgrade now to continue using Loopreach.io without interruption.
                </p>
              </div>
              <Button onClick={() => handleUpgrade('growth')} className="bg-red-600 hover:bg-red-700">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}