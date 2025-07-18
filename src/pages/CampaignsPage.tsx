import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { 
  Plus, 
  Play, 
  Pause, 
  MoreHorizontal, 
  Mail, 
  Users, 
  TrendingUp, 
  Calendar,
  Target,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface Campaign {
  id: string
  userId: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  campaignType: 'email' | 'linkedin' | 'mixed'
  totalLeads: number
  emailsSent: number
  opens: number
  replies: number
  meetingsBooked: number
  createdAt: string
  updatedAt: string
}

interface CampaignSequence {
  id: string
  campaignId: string
  stepNumber: number
  stepType: 'email' | 'linkedin' | 'wait'
  subject?: string
  content?: string
  waitDays?: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [sequences, setSequences] = useState<CampaignSequence[]>([])
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    campaignType: 'email' as const,
    selectedLeads: [] as string[]
  })
  const [newSequence, setNewSequence] = useState({
    stepType: 'email' as const,
    subject: '',
    content: '',
    waitDays: 3
  })

  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load campaigns
      const campaignsData = await blink.db.campaigns.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setCampaigns(campaignsData)

      // Load leads
      const leadsData = await blink.db.leads.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setLeads(leadsData)

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load campaigns. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSequences = async (campaignId: string) => {
    try {
      const sequencesData = await blink.db.campaignSequences.list({
        where: { campaignId },
        orderBy: { stepNumber: 'asc' }
      })
      setSequences(sequencesData)
    } catch (error) {
      console.error('Error loading sequences:', error)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive"
      })
      return
    }

    try {
      const user = await blink.auth.me()
      const campaign = await blink.db.campaigns.create({
        userId: user.id,
        name: newCampaign.name,
        description: newCampaign.description,
        campaignType: newCampaign.campaignType,
        status: 'draft',
        totalLeads: newCampaign.selectedLeads.length,
        emailsSent: 0,
        opens: 0,
        replies: 0,
        meetingsBooked: 0
      })

      toast({
        title: "Success!",
        description: "Campaign created successfully."
      })

      setIsCreateOpen(false)
      setNewCampaign({
        name: '',
        description: '',
        campaignType: 'email',
        selectedLeads: []
      })
      loadData()

    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddSequenceStep = async () => {
    if (!selectedCampaign) return

    if (newSequence.stepType !== 'wait' && !newSequence.content.trim()) {
      toast({
        title: "Error",
        description: "Content is required for email and LinkedIn steps",
        variant: "destructive"
      })
      return
    }

    try {
      const stepNumber = sequences.length + 1
      await blink.db.campaignSequences.create({
        campaignId: selectedCampaign.id,
        stepNumber,
        stepType: newSequence.stepType,
        subject: newSequence.subject,
        content: newSequence.content,
        waitDays: newSequence.waitDays
      })

      toast({
        title: "Success!",
        description: "Sequence step added successfully."
      })

      setNewSequence({
        stepType: 'email',
        subject: '',
        content: '',
        waitDays: 3
      })
      loadSequences(selectedCampaign.id)

    } catch (error) {
      console.error('Error adding sequence step:', error)
      toast({
        title: "Error",
        description: "Failed to add sequence step. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleStartCampaign = async (campaignId: string) => {
    try {
      await blink.db.campaigns.update(campaignId, { status: 'active' })
      
      // Simulate sending emails
      const campaign = campaigns.find(c => c.id === campaignId)
      if (campaign) {
        const emailsSent = Math.min(campaign.totalLeads, 50) // Simulate batch sending
        await blink.db.campaigns.update(campaignId, { 
          emailsSent,
          opens: Math.floor(emailsSent * 0.3), // 30% open rate
          replies: Math.floor(emailsSent * 0.05) // 5% reply rate
        })
      }

      toast({
        title: "Campaign Started!",
        description: "Your campaign is now active and sending emails."
      })
      loadData()

    } catch (error) {
      console.error('Error starting campaign:', error)
      toast({
        title: "Error",
        description: "Failed to start campaign. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await blink.db.campaigns.update(campaignId, { status: 'paused' })
      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused."
      })
      loadData()
    } catch (error) {
      console.error('Error pausing campaign:', error)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await blink.db.campaigns.delete(campaignId)
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been deleted successfully."
      })
      loadData()
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    }
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const calculateConversionRate = (replies: number, sent: number) => {
    return sent > 0 ? ((replies / sent) * 100).toFixed(1) : '0.0'
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
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Create and manage your outreach campaigns</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new outreach campaign with automated sequences
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., SaaS Outreach Q1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select 
                    value={newCampaign.campaignType} 
                    onValueChange={(value: 'email' | 'linkedin' | 'mixed') => 
                      setNewCampaign(prev => ({ ...prev, campaignType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="linkedin">LinkedIn Only</SelectItem>
                      <SelectItem value="mixed">Email + LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your campaign goals and target audience..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Leads ({leads.length} available)</Label>
                <div className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-600">
                    All available leads will be included in this campaign. 
                    You can filter and segment leads after creation.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
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
              <Play className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + (Number(c.emailsSent) || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Meetings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + (Number(c.meetingsBooked) || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            Manage your outreach campaigns and track performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Replies</TableHead>
                  <TableHead>Conversion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <Badge variant="outline">
                        {campaign.campaignType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {campaign.totalLeads}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {campaign.emailsSent}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-gray-400" />
                        {campaign.opens}
                        {campaign.emailsSent > 0 && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({Math.round((campaign.opens / campaign.emailsSent) * 100)}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                        {campaign.replies}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {calculateConversionRate(campaign.replies, campaign.emailsSent)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedCampaign(campaign)
                            loadSequences(campaign.id)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Sequence
                          </DropdownMenuItem>
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleStartCampaign(campaign.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Campaign
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'active' && (
                            <DropdownMenuItem onClick={() => handlePauseCampaign(campaign.id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Campaign
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {campaigns.length === 0 && (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first outreach campaign.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Sequence Builder */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign Sequence: {selectedCampaign.name}</DialogTitle>
              <DialogDescription>
                Build your automated outreach sequence with emails, LinkedIn messages, and wait steps
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Existing Sequence Steps */}
              <div className="space-y-4">
                <h4 className="font-medium">Current Sequence ({sequences.length} steps)</h4>
                {sequences.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Step {step.stepNumber}</Badge>
                            <Badge className={
                              step.stepType === 'email' ? 'bg-blue-100 text-blue-800' :
                              step.stepType === 'linkedin' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {step.stepType}
                            </Badge>
                          </div>
                          {step.stepType === 'wait' ? (
                            <p className="text-sm text-gray-600">
                              Wait {step.waitDays} days before next step
                            </p>
                          ) : (
                            <div>
                              {step.subject && (
                                <p className="font-medium text-sm mb-1">Subject: {step.subject}</p>
                              )}
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {step.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Step */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Step</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Step Type</Label>
                      <Select 
                        value={newSequence.stepType} 
                        onValueChange={(value: 'email' | 'linkedin' | 'wait') => 
                          setNewSequence(prev => ({ ...prev, stepType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                          <SelectItem value="wait">Wait Period</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newSequence.stepType === 'wait' && (
                      <div className="space-y-2">
                        <Label>Wait Days</Label>
                        <Input
                          type="number"
                          value={newSequence.waitDays}
                          onChange={(e) => setNewSequence(prev => ({ 
                            ...prev, 
                            waitDays: parseInt(e.target.value) || 0 
                          }))}
                          min="1"
                          max="30"
                        />
                      </div>
                    )}
                  </div>
                  
                  {newSequence.stepType !== 'wait' && (
                    <>
                      {newSequence.stepType === 'email' && (
                        <div className="space-y-2">
                          <Label>Subject Line</Label>
                          <Input
                            value={newSequence.subject}
                            onChange={(e) => setNewSequence(prev => ({ 
                              ...prev, 
                              subject: e.target.value 
                            }))}
                            placeholder="e.g., Following up on {{company}}"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>
                          {newSequence.stepType === 'email' ? 'Email Content' : 'LinkedIn Message'}
                        </Label>
                        <Textarea
                          value={newSequence.content}
                          onChange={(e) => setNewSequence(prev => ({ 
                            ...prev, 
                            content: e.target.value 
                          }))}
                          placeholder={
                            newSequence.stepType === 'email' 
                              ? "Hi {{firstName}},\n\nI hope this email finds you well..."
                              : "Hi {{firstName}}, I'd love to connect and discuss..."
                          }
                          rows={6}
                        />
                      </div>
                    </>
                  )}
                  
                  <Button onClick={handleAddSequenceStep} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step to Sequence
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}