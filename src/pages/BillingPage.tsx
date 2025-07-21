import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Check, 
  Star, 
  Users, 
  Mail, 
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Crown,
  Download,
  Clock
} from 'lucide-react'
import { blink } from '@/blink/client'

export default function BillingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [usage, setUsage] = useState({
    leadsGenerated: 0,
    emailsSent: 0,
    meetingsBooked: 0,
    campaignsActive: 0
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadUsageData = async () => {
    if (!user?.id) return

    try {
      // Load user's usage data
      const leads = await blink.db.leads.list({ where: { userId: user.id } })
      const messages = await blink.db.messages.list({ where: { userId: user.id } })
      const meetings = await blink.db.meetings.list({ where: { userId: user.id } })
      const campaigns = await blink.db.campaigns.list({ 
        where: { userId: user.id, status: 'active' } 
      })

      setUsage({
        leadsGenerated: leads.length,
        emailsSent: messages.length,
        meetingsBooked: meetings.length,
        campaignsActive: campaigns.length
      })
    } catch (error) {
      console.error('Error loading usage data:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadUsageData()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: '$0',
      period: '7 days',
      description: 'Perfect for testing Loopreach',
      features: [
        '500 verified leads',
        '2 active campaigns',
        'Email outreach only',
        'Basic analytics',
        'Community support'
      ],
      limits: {
        leads: 500,
        campaigns: 2,
        emails: 1000
      },
      popular: false,
      current: currentPlan === 'free'
    },
    {
      id: 'growth',
      name: 'Growth',
      price: '$49',
      period: 'per month',
      description: 'Scale your outreach efforts',
      features: [
        '10,000 verified leads/month',
        '6 guaranteed meetings/month',
        'Email + LinkedIn outreach',
        'AI-powered personalization',
        'Advanced analytics',
        'CRM integrations',
        'Lead replacement policy',
        'Priority support'
      ],
      limits: {
        leads: 10000,
        campaigns: 10,
        emails: 25000
      },
      popular: true,
      current: currentPlan === 'growth'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$119',
      period: 'per month',
      description: 'For teams that need maximum scale',
      features: [
        '15,000 verified leads/month',
        '20 guaranteed meetings/month',
        'Everything in Growth',
        'Dedicated account manager',
        'Custom ICP filters',
        'A/B tested campaigns',
        'Advanced campaign analytics',
        'Native CRM integrations',
        'White-label options',
        'Custom integrations'
      ],
      limits: {
        leads: 15000,
        campaigns: 'unlimited',
        emails: 50000
      },
      popular: false,
      current: currentPlan === 'enterprise'
    }
  ]

  const handleUpgrade = (planId: string) => {
    // Placeholder for Stripe integration
    alert(`Stripe integration coming soon! You selected the ${plans.find(p => p.id === planId)?.name} plan.`)
  }

  const handleManageBilling = () => {
    // Placeholder for Stripe customer portal
    alert('Stripe customer portal coming soon!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading billing...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view billing</p>
          <Button onClick={() => blink.auth.login()} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
          <p className="text-gray-600">Manage your subscription and usage</p>
        </div>
        {currentPlan !== 'free' && (
          <Button variant="outline" onClick={handleManageBilling}>
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        )}
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Current Plan Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {plans.find(p => p.current)?.name || 'Free Trial'}
                  </h3>
                  <p className="text-gray-600">
                    {currentPlan === 'free' 
                      ? 'Your free trial is active' 
                      : 'Your subscription is active'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {plans.find(p => p.current)?.price || '$0'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {plans.find(p => p.current)?.period || '7 days'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    {plan.current ? (
                      <Button className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {plan.id === 'free' ? 'Start Free Trial' : 'Upgrade to ' + plan.name}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>Compare what's included in each plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Feature</th>
                      <th className="text-center py-2">Free Trial</th>
                      <th className="text-center py-2">Growth</th>
                      <th className="text-center py-2">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b">
                      <td className="py-2">Verified leads/month</td>
                      <td className="text-center">500</td>
                      <td className="text-center">10,000</td>
                      <td className="text-center">15,000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Active campaigns</td>
                      <td className="text-center">2</td>
                      <td className="text-center">10</td>
                      <td className="text-center">Unlimited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Email outreach</td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">LinkedIn outreach</td>
                      <td className="text-center">-</td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">AI personalization</td>
                      <td className="text-center">Basic</td>
                      <td className="text-center">Advanced</td>
                      <td className="text-center">Advanced</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">CRM integrations</td>
                      <td className="text-center">-</td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                      <td className="text-center"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Dedicated support</td>
                      <td className="text-center">Community</td>
                      <td className="text-center">Priority</td>
                      <td className="text-center">Dedicated Manager</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leads Generated</p>
                    <p className="text-2xl font-bold">{usage.leadsGenerated}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(usage.leadsGenerated / (plans.find(p => p.current)?.limits.leads || 500)) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.leadsGenerated} / {plans.find(p => p.current)?.limits.leads || 500} leads
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Emails Sent</p>
                    <p className="text-2xl font-bold">{usage.emailsSent}</p>
                  </div>
                  <Mail className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(usage.emailsSent / (plans.find(p => p.current)?.limits.emails || 1000)) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.emailsSent} / {plans.find(p => p.current)?.limits.emails || 1000} emails
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Meetings Booked</p>
                    <p className="text-2xl font-bold">{usage.meetingsBooked}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold">{usage.campaignsActive}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={plans.find(p => p.current)?.limits.campaigns === 'unlimited' 
                      ? 0 
                      : (usage.campaignsActive / (plans.find(p => p.current)?.limits.campaigns || 2)) * 100
                    } 
                    className="h-2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.campaignsActive} / {plans.find(p => p.current)?.limits.campaigns || 2} campaigns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Alerts */}
          {usage.leadsGenerated > (plans.find(p => p.current)?.limits.leads || 500) * 0.8 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Approaching Lead Limit</p>
                    <p className="text-sm text-yellow-700">
                      You've used {Math.round((usage.leadsGenerated / (plans.find(p => p.current)?.limits.leads || 500)) * 100)}% of your monthly lead quota. 
                      Consider upgrading to continue generating leads.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your payment history and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {currentPlan === 'free' 
                    ? 'No billing history yet. You\'re on the free trial.'
                    : 'Stripe billing integration coming soon!'
                  }
                </p>
                {currentPlan === 'free' && (
                  <Button onClick={() => handleUpgrade('growth')}>
                    Upgrade to Growth Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for future billing history */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Secure payment processing with Stripe (coming soon)
                </p>
                <p className="text-sm text-gray-500">
                  We'll integrate with Stripe for secure, reliable billing once the company is registered.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}