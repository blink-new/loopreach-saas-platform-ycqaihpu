import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { CheckCircle, ArrowRight, Zap, Target, Calendar, BarChart3, Users, Mail } from 'lucide-react'
import { blink } from '../blink/client'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    try {
      blink.auth.login()
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img src="/loopreach-logo.png" alt="Loopreach.io" className="h-8" />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleGetStarted}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Start Free Trial'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
            🚀 Your AI-Powered Business Development Agent
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Replace Your SDR Team with
            <span className="text-blue-600"> AI Automation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Go from lead generation to meeting bookings on autopilot. Loopreach automates your entire sales pipeline 
            with AI-powered outreach, lead scoring, and campaign management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" onClick={handleGetStarted} disabled={isLoading} className="px-8 py-4 text-lg">
              {isLoading ? 'Loading...' : 'Start 7-Day Free Trial'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-gray-500">
              ✨ 500 free verified leads • No credit card required
            </p>
          </div>
          
          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Verified Leads/Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">6-20</div>
              <div className="text-gray-600">Guaranteed Meetings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
              <div className="text-gray-600">Time Saved vs Manual</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Outreach
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From lead generation to meeting booking, we've automated the entire sales development process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Zap className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>AI-Powered Outreach</CardTitle>
                <CardDescription>
                  Generate personalized cold emails and LinkedIn messages that convert
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Target className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Smart Lead Scoring</CardTitle>
                <CardDescription>
                  AI analyzes responses and scores leads based on buying intent
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Calendar className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Meeting Automation</CardTitle>
                <CardDescription>
                  Automatically book meetings when leads show interest
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-orange-600 mb-4" />
                <CardTitle>Campaign Analytics</CardTitle>
                <CardDescription>
                  Track opens, replies, and conversions with detailed reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-indigo-600 mb-4" />
                <CardTitle>CRM Integration</CardTitle>
                <CardDescription>
                  Sync with HubSpot, Pipedrive, and other popular CRMs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Mail className="h-10 w-10 text-red-600 mb-4" />
                <CardTitle>Multi-Channel Sequences</CardTitle>
                <CardDescription>
                  Email + LinkedIn outreach with intelligent follow-ups
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start with a free trial, then choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Growth Plan */}
            <Card className="border-2 border-blue-200 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Growth Plan</CardTitle>
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
                <Button className="w-full" size="lg" onClick={handleGetStarted}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 hover:border-gray-300 transition-colors">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Enterprise Plan</CardTitle>
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
                <Button variant="outline" className="w-full" size="lg" onClick={handleGetStarted}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Replace Your SDR Team?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of companies already using Loopreach to automate their sales pipeline
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted} disabled={isLoading} className="px-8 py-4 text-lg">
            {isLoading ? 'Loading...' : 'Start Your Free Trial'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-blue-200 mt-4">
            7-day free trial • 500 free leads • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/loopreach-logo.png" alt="Loopreach.io" className="h-8" />
            </div>
            <div className="text-sm text-gray-400">
              © 2024 Loopreach.io. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}