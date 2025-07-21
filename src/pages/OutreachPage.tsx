import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { 
  Send, 
  Users, 
  Mail, 
  Eye, 
  MessageSquare, 
  Calendar,
  Play,
  Pause,
  BarChart3,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { realOutreachService as outreachService, type OutreachCampaign, type Lead } from '@/services/realOutreachService'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'loopreach-saas-platform-ycqaihpu',
  authRequired: true
})

export default function OutreachPage() {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Campaign creation form
  const [campaignName, setCampaignName] = useState('')
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignMessage, setCampaignMessage] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [tone, setTone] = useState<'professional' | 'casual' | 'friendly'>('professional')

  const loadLeads = async (): Promise<Lead[]> => {
    try {
      console.log('Getting user...')
      const user = await blink.auth.me()
      console.log('User ID:', user.id)
      
      console.log('Querying leads...')
      const leadsData = await blink.db.leads.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      console.log('Raw leads data:', leadsData)
      
      // The SDK automatically converts snake_case to camelCase, so no manual mapping is needed.
      console.log('Leads from SDK:', leadsData)
      return leadsData as Lead[]
    } catch (error) {
      console.error('Error loading leads:', error)
      return []
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Loading outreach data...')
      
      // Load leads first
      const leadsData = await loadLeads()
      console.log('Loaded leads:', leadsData.length)
      setLeads(leadsData)
      
      // Load campaigns
      const campaignsData = await outreachService.getCampaigns()
      console.log('Loaded campaigns:', campaignsData.length)
      setCampaigns(campaignsData)
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: `Failed to load data: ${error.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const generateAIMessage = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for AI generation.",
        variant: "destructive"
      })
      return
    }

    try {
      setGenerating(true)
      const result = await outreachService.generateOutreachMessage(aiPrompt, tone)
      setCampaignSubject(result.subject)
      setCampaignMessage(result.message)
      toast({
        title: "Success",
        description: "AI message generated successfully!"
      })
    } catch (error) {
      console.error('Error generating AI message:', error)
      toast({
        title: "Error",
        description: "Failed to generate AI message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const createCampaign = async () => {
    if (!campaignName.trim() || !campaignSubject.trim() || !campaignMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all campaign fields.",
        variant: "destructive"
      })
      return
    }

    if (selectedLeads.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lead for the campaign.",
        variant: "destructive"
      })
      return
    }

    try {
      setCreating(true)
      const campaign = await outreachService.createCampaign({
        name: campaignName,
        subject: campaignSubject,
        message: campaignMessage,
        status: 'draft',
        leadIds: selectedLeads
      })

      setCampaigns(prev => [campaign, ...prev])
      
      // Reset form
      setCampaignName('')
      setCampaignSubject('')
      setCampaignMessage('')
      setSelectedLeads([])
      setAiPrompt('')

      toast({
        title: "Success",
        description: "Campaign created successfully!"
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const launchCampaign = async (campaignId: string) => {
    try {
      await outreachService.launchCampaign(campaignId)
      await loadData() // Refresh data
      toast({
        title: "Success",
        description: "Campaign launched successfully! Emails are being sent."
      })
    } catch (error) {
      console.error('Error launching campaign:', error)
      toast({
        title: "Error",
        description: "Failed to launch campaign. Please try again.",
        variant: "destructive"
      })
    }
  }

  const pauseCampaign = async (campaignId: string) => {
    try {
      await outreachService.pauseCampaign(campaignId)
      await loadData()
      toast({
        title: "Success",
        description: "Campaign paused successfully."
      })
    } catch (error) {
      console.error('Error pausing campaign:', error)
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive"
      })
    }
  }

  const resumeCampaign = async (campaignId: string) => {
    try {
      await outreachService.resumeCampaign(campaignId)
      await loadData()
      toast({
        title: "Success",
        description: "Campaign resumed successfully."
      })
    } catch (error) {
      console.error('Error resuming campaign:', error)
      toast({
        title: "Error",
        description: "Failed to resume campaign. Please try again.",
        variant: "destructive"
      })
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const selectAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      active: { color: 'bg-green-100 text-green-800', icon: Play },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Outreach</h1>
          <p className="text-gray-600 mt-1">Create and manage AI-powered outreach campaigns</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Outreach Campaign</DialogTitle>
              <DialogDescription>
                Set up an AI-powered outreach campaign to engage with your leads
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Campaign Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Q1 Product Launch Outreach"
                  />
                </div>
              </div>

              {/* AI Message Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    AI Message Generator
                  </CardTitle>
                  <CardDescription>
                    Let AI create personalized outreach messages for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="aiPrompt">Describe your outreach goal</Label>
                    <Textarea
                      id="aiPrompt"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., I want to introduce our new CRM software to sales managers at tech startups. Focus on how it can increase their team's productivity by 40%."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={generateAIMessage} 
                    disabled={generating || !aiPrompt.trim()}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Message
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Message Content */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="Quick question about {{company}}'s sales process"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Email Message</Label>
                  <Textarea
                    id="message"
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    placeholder="Hi {{firstName}},&#10;&#10;I noticed {{company}} is growing fast..."
                    rows={8}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use tokens like {`{{firstName}}`}, {`{{company}}`}, {`{{title}}`} for personalization
                  </p>
                </div>
              </div>

              {/* Lead Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Select Leads ({selectedLeads.length} selected)
                    </span>
                    <Button variant="outline" size="sm" onClick={selectAllLeads}>
                      {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No leads available. Please generate leads first.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedLeads.includes(lead.id)}
                                  onCheckedChange={() => toggleLeadSelection(lead.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {lead.firstName} {lead.lastName}
                              </TableCell>
                              <TableCell>{lead.companyName}</TableCell>
                              <TableCell>{lead.jobTitle}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{lead.score}/100</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button 
                onClick={createCampaign} 
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.length > 0 
                    ? Math.round(campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Reply Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.length > 0 
                    ? Math.round(campaigns.reduce((sum, c) => sum + c.replyRate, 0) / campaigns.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>
            Manage and monitor your outreach campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Create your first AI-powered outreach campaign to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Reply Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-500">{campaign.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>{campaign.leadIds.length}</TableCell>
                    <TableCell>{campaign.sentCount}</TableCell>
                    <TableCell>{campaign.openRate}%</TableCell>
                    <TableCell>{campaign.replyRate}%</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => launchCampaign(campaign.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Launch
                          </Button>
                        )}
                        {campaign.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseCampaign(campaign.id)}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        {campaign.status === 'paused' && (
                          <Button
                            size="sm"
                            onClick={() => resumeCampaign(campaign.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Stats
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}