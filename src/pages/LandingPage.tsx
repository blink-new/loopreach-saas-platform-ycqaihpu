import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, Users, Target, Calendar, TrendingUp, Mail, MessageSquare, BarChart3, Zap, Shield, Globe } from 'lucide-react'
import { blink } from '@/blink/client'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    try {
      // Use window.location for faster redirect
      window.location.href = 'https://blink.new/auth?redirect=' + encodeURIComponent(window.location.origin + '/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      // Fallback to blink auth
      await blink.auth.login('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "AI Lead Generation",
      description: "Find and verify high-quality prospects with our AI-powered lead discovery engine."
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Personalized Outreach",
      description: "Generate compelling, personalized emails and LinkedIn messages that get responses."
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Smart Follow-ups",
      description: "Automated follow-up sequences that adapt based on prospect behavior and responses."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Meeting Booking",
      description: "Seamlessly book qualified meetings directly into your calendar with smart scheduling."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Performance Analytics",
      description: "Track open rates, response rates, and conversion metrics with detailed insights."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "CRM Integration",
      description: "Sync with HubSpot, Pipedrive, and other CRMs to keep your pipeline organized."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Founder, TechStart",
      content: "Loopreach.io helped us book 15 qualified meetings in our first month. The AI personalization is incredible.",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "Sales Director, GrowthCo",
      content: "We replaced our entire SDR team with Loopreach.io and increased our meeting booking rate by 300%.",
      avatar: "MR"
    },
    {
      name: "Emily Watson",
      role: "CEO, InnovateLabs",
      content: "The time savings are massive. What used to take our team weeks now happens automatically in days.",
      avatar: "EW"
    }
  ]

  const stats = [
    { value: "10,000+", label: "Leads Generated" },
    { value: "85%", label: "Open Rate" },
    { value: "25%", label: "Response Rate" },
    { value: "500+", label: "Meetings Booked" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/loopreach-logo.svg" 
                alt="Loopreach.io" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-slate-900">Loopreach.io</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Features
              </Button>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Pricing
              </Button>
              <Button 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Loading...' : 'Get Started'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Zap className="h-3 w-3 mr-1" />
            7-Day Free Trial • No Credit Card Required
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Your AI Business
            <span className="block text-gradient">Development Agent</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Loopreach.io handles outreach, qualifies leads, follows up, and books meetings — 
            personalized and automated, so you can focus on growing your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              disabled={isLoading}
              className="btn-primary text-lg px-8 py-4 h-auto"
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 h-auto border-slate-300 hover:bg-slate-50"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to scale outreach
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From lead generation to meeting booking, Loopreach.io automates your entire sales pipeline
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="metric-card border-0 hover:scale-105 transition-transform duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              How Loopreach.io Works
            </h2>
            <p className="text-xl text-slate-600">
              Get started in minutes, see results in days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Define Your ICP</h3>
              <p className="text-slate-600">Tell us about your ideal customer profile and target market</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">AI Finds & Reaches Out</h3>
              <p className="text-slate-600">Our AI generates leads and sends personalized outreach messages</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Book Qualified Meetings</h3>
              <p className="text-slate-600">Interested prospects book meetings directly into your calendar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Trusted by growing companies
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="metric-card border-0">
                <CardContent className="p-6">
                  <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to automate your outreach?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of companies using Loopreach.io to scale their sales pipeline
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            disabled={isLoading}
            className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-4 h-auto font-semibold"
          >
            {isLoading ? 'Loading...' : 'Start Your Free Trial'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-blue-100 mt-4 text-sm">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/loopreach-logo.svg" 
                  alt="Loopreach.io" 
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">Loopreach.io</span>
              </div>
              <p className="text-slate-400">
                Your AI-powered business development agent
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Status</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Loopreach.io. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}