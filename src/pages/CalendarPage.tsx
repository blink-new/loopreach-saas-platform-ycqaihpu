import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Video,
  MapPin,
  User
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface CalendarIntegration {
  id: string
  userId: string
  provider: 'google' | 'calendly' | 'outlook'
  calendarUrl?: string
  isActive: boolean
  createdAt: string
}

interface Meeting {
  id: string
  userId: string
  leadId: string
  campaignId?: string
  meetingTitle: string
  meetingDate?: string
  meetingTime?: string
  startTime?: string
  meetingUrl?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: string
}

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  title: string
}

export default function CalendarPage() {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [calendlyUrl, setCalendlyUrl] = useState('')
  const [newMeeting, setNewMeeting] = useState({
    leadId: '',
    meetingTitle: '',
    meetingDate: '',
    meetingUrl: ''
  })

  const { toast } = useToast()

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load calendar integrations
      const integrationsData = await blink.db.calendarIntegrations.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setIntegrations(integrationsData)

      // Load meetings
      const meetingsData = await blink.db.meetings.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setMeetings(meetingsData)

      // Load leads for booking
      const dbLeads = await blink.db.leads.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      
      // Map database fields to expected format
      const mappedLeads = dbLeads.map(lead => ({
        id: lead.id,
        firstName: lead.firstName || lead.first_name || lead.name?.split(' ')[0] || '',
        lastName: lead.lastName || lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        company: lead.company || lead.company_name || '',
        title: lead.jobTitle || lead.job_title || lead.title || ''
      }))
      
      setLeads(mappedLeads)

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load calendar data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectCalendly = async () => {
    if (!calendlyUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Calendly URL",
        variant: "destructive"
      })
      return
    }

    try {
      const user = await blink.auth.me()
      await blink.db.calendarIntegrations.create({
        userId: user.id,
        provider: 'calendly',
        calendarUrl: calendlyUrl,
        isActive: true
      })

      toast({
        title: "Success!",
        description: "Calendly integration connected successfully."
      })

      setIsConnectOpen(false)
      setCalendlyUrl('')
      loadData()

    } catch (error) {
      console.error('Error connecting Calendly:', error)
      toast({
        title: "Error",
        description: "Failed to connect Calendly. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBookMeeting = async () => {
    if (!newMeeting.leadId || !newMeeting.meetingTitle || !newMeeting.meetingDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const user = await blink.auth.me()
      await blink.db.meetings.create({
        userId: user.id,
        leadId: newMeeting.leadId,
        meetingTitle: newMeeting.meetingTitle,
        title: newMeeting.meetingTitle,
        meetingTime: newMeeting.meetingDate,
        startTime: newMeeting.meetingDate,
        meetingUrl: newMeeting.meetingUrl,
        status: 'scheduled'
      })

      // Update lead status
      await blink.db.leads.update(newMeeting.leadId, { status: 'meeting_booked' })

      toast({
        title: "Success!",
        description: "Meeting booked successfully."
      })

      setIsBookingOpen(false)
      setNewMeeting({
        leadId: '',
        meetingTitle: '',
        meetingDate: '',
        meetingUrl: ''
      })
      loadData()

    } catch (error) {
      console.error('Error booking meeting:', error)
      toast({
        title: "Error",
        description: "Failed to book meeting. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      await blink.db.calendarIntegrations.delete(integrationId)
      toast({
        title: "Success",
        description: "Calendar integration disconnected."
      })
      loadData()
    } catch (error) {
      console.error('Error disconnecting integration:', error)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">G</div>
      case 'calendly':
        return <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
      case 'outlook':
        return <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">O</div>
      default:
        return <Calendar className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLeadById = (leadId: string) => {
    return leads.find(lead => lead.id === leadId)
  }

  const upcomingMeetings = meetings.filter(m => 
    m.status === 'scheduled' && new Date(m.meetingTime || m.startTime || m.createdAt) > new Date()
  )

  const pastMeetings = meetings.filter(m => 
    m.status === 'completed' || new Date(m.meetingTime || m.startTime || m.createdAt) < new Date()
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Calendar Integration</h1>
          <p className="text-gray-600 mt-1">Connect your calendar and manage meeting bookings</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Calendar</DialogTitle>
                <DialogDescription>
                  Connect your calendar service to enable automatic meeting booking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calendly-url">Calendly URL</Label>
                  <Input
                    id="calendly-url"
                    value={calendlyUrl}
                    onChange={(e) => setCalendlyUrl(e.target.value)}
                    placeholder="https://calendly.com/your-username/meeting"
                  />
                  <p className="text-xs text-gray-500">
                    Enter your Calendly scheduling link
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsConnectOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnectCalendly}>
                    Connect Calendly
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Book Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book New Meeting</DialogTitle>
                <DialogDescription>
                  Schedule a meeting with one of your leads
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lead">Lead *</Label>
                  <select
                    id="lead"
                    value={newMeeting.leadId}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, leadId: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a lead...</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {(lead.firstName || '')} {(lead.lastName || '')} - {lead.company}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    value={newMeeting.meetingTitle}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meetingTitle: e.target.value }))}
                    placeholder="e.g., Product Demo Call"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={newMeeting.meetingDate}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meetingDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Meeting URL</Label>
                  <Input
                    id="url"
                    value={newMeeting.meetingUrl}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meetingUrl: e.target.value }))}
                    placeholder="https://zoom.us/j/123456789"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBookMeeting}>
                    Book Meeting
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingMeetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {meetings.filter(m => m.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integrations</CardTitle>
          <CardDescription>
            Manage your connected calendar services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length > 0 ? (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(integration.provider)}
                    <div>
                      <div className="font-medium capitalize">{integration.provider}</div>
                      {integration.calendarUrl && (
                        <div className="text-sm text-gray-500">{integration.calendarUrl}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {integration.isActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDisconnectIntegration(integration.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No calendar integrations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect your calendar to enable automatic meeting booking.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsConnectOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Calendar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meetings */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>
                Your scheduled meetings with leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Meeting</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingMeetings.map((meeting) => {
                        const lead = getLeadById(meeting.leadId)
                        return (
                          <TableRow key={meeting.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{meeting.meetingTitle}</div>
                                {meeting.meetingUrl && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Video className="h-3 w-3 mr-1" />
                                    Video call
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {lead ? (
                                <div>
                                  <div className="font-medium">{(lead.firstName || "")} {(lead.lastName || "")}</div>
                                  <div className="text-sm text-gray-500">{lead.company}</div>
                                </div>
                              ) : (
                                <div className="text-gray-500">Lead not found</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                {formatDate(meeting.meetingTime || meeting.startTime || meeting.meetingDate || meeting.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(meeting.status)}
                            </TableCell>
                            <TableCell>
                              {meeting.meetingUrl && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Join
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming meetings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Book your first meeting with a lead to get started.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsBookingOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book Meeting
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Meetings</CardTitle>
              <CardDescription>
                Your meeting history and completed calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Meeting</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastMeetings.map((meeting) => {
                        const lead = getLeadById(meeting.leadId)
                        return (
                          <TableRow key={meeting.id}>
                            <TableCell>
                              <div className="font-medium">{meeting.meetingTitle}</div>
                            </TableCell>
                            <TableCell>
                              {lead ? (
                                <div>
                                  <div className="font-medium">{(lead.firstName || "")} {(lead.lastName || "")}</div>
                                  <div className="text-sm text-gray-500">{lead.company}</div>
                                </div>
                              ) : (
                                <div className="text-gray-500">Lead not found</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                {formatDate(meeting.meetingTime || meeting.startTime || meeting.meetingDate || meeting.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(meeting.status)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No past meetings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your completed meetings will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}