import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Play, 
  Pause, 
  BarChart3, 
  Mail, 
  Linkedin, 
  Calendar,
  Users,
  TrendingUp,
  Eye,
  MessageSquare,
  Clock,
  Settings
} from 'lucide-react'
import { blink } from '@/blink/client'
import { campaignService, type Campaign, type CampaignMessage } from '@/services/campaignService'
import { leadGenerationService } from '@/services/leadGeneration'
import { analyticsService } from '@/services/analyticsService'
import { CampaignForm } from '@/components/CampaignForm'
import { AIMessageGenerator } from '@/components/AIMessageGenerator'
import { CampaignDetails } from '@/components/CampaignDetails'

export default function CampaignsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [aiMessages, setAiMessages] = useState<CampaignMessage[]>([])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadCampaigns = useCallback(async () => {
    if (!user?.id) return

    try {
      const userCampaigns = await campaignService.getCampaignsByUser(user.id)
      setCampaigns(userCampaigns)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadCampaigns()
    }
  }, [user?.id, loadCampaigns])

  const handleCreateCampaign = async (campaignData: any) => {
    if (!user?.id) return

    setIsCreating(true)
    try {
      await campaignService.createCampaign(user.id, campaignData)
      await loadCampaigns()
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Error creating campaign')
    } finally {
      setIsCreating(false)
    }
  }

  const handleLaunchCampaign = async (campaignId: string) => {
    try {
      await campaignService.launchCampaign(campaignId)
      await loadCampaigns()
      alert('Campaign launched successfully!')
    } catch (error) {
      console.error('Error launching campaign:', error)
      alert('Error launching campaign')
    }
  }

  const handleGenerateAIMessages = async (formData: any) => {
    try {
      const messages = await campaignService.generateAIMessages(
        formData.companyInfo,
        formData.targetAudience,
        formData.campaignGoal
      )
      setAiMessages(messages)
    } catch (error) {
      console.error('Error generating AI messages:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'draft': return 'secondary'
      case 'paused': return 'outline'
      case 'completed': return 'destructive'
      default: return 'secondary'
    }
  }

  const calculateConversionRate = (campaign: Campaign) => {
    if (campaign.sentCount === 0) return 0
    return ((campaign.meetingsBooked / campaign.sentCount) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view campaigns</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Manage your outreach campaigns</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Campaign Assistant</DialogTitle>
                <DialogDescription>
                  Let AI generate personalized messages for your campaign
                </DialogDescription>
              </DialogHeader>
              <AIMessageGenerator 
                onGenerate={handleGenerateAIMessages}
                messages={aiMessages}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Set up your outreach campaign with AI-powered messaging
                </DialogDescription>
              </DialogHeader>
              <CampaignForm 
                onSubmit={handleCreateCampaign}
                isCreating={isCreating}
                aiMessages={aiMessages}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'active').length}
                </div>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
                </div>
                <p className="text-sm text-gray-600">Messages Sent</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.meetingsBooked, 0)}
                </div>
                <p className="text-sm text-gray-600">Meetings Booked</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>Track performance and manage your outreach campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Replied</TableHead>
                <TableHead>Meetings</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(campaign.type === 'email' || campaign.type === 'mixed') && (
                        <Badge variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Badge>
                      )}
                      {(campaign.type === 'linkedin' || campaign.type === 'mixed') && (
                        <Badge variant="outline" className="text-xs">
                          <Linkedin className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.totalLeads}</TableCell>
                  <TableCell>{campaign.sentCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{campaign.openedCount}</span>
                      {campaign.sentCount > 0 && (
                        <span className="text-xs text-gray-500">
                          ({((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{campaign.repliedCount}</span>
                      {campaign.sentCount > 0 && (
                        <span className="text-xs text-gray-500">
                          ({((campaign.repliedCount / campaign.sentCount) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{campaign.meetingsBooked}</TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(calculateConversionRate(campaign)) > 5 ? 'default' : 'secondary'}>
                      {calculateConversionRate(campaign)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleLaunchCampaign(campaign.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Launch
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                    <div>
                      <p>No campaigns yet. Create your first campaign to get started!</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>Campaign performance and details</DialogDescription>
            </DialogHeader>
            <CampaignDetails campaign={selectedCampaign} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

