import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Linkedin, 
  Calendar, 
  Globe, 
  Shield, 
  Bell,
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react'
import { blink } from '@/blink/client'
import { integrationService } from '@/services/integrationService'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integrations, setIntegrations] = useState<any[]>([])
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: '',
    company: '',
    timezone: 'UTC',
    logoUrl: ''
  })

  // Integration settings
  const [emailSettings, setEmailSettings] = useState({
    provider: '',
    isConnected: false,
    email: ''
  })

  const [linkedinSettings, setLinkedinSettings] = useState({
    isConnected: false,
    profileUrl: ''
  })

  const [calendarSettings, setCalendarSettings] = useState({
    provider: '',
    isConnected: false,
    calendlyLink: ''
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    meetingReminders: true,
    weeklyReports: true
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadUserData = useCallback(async () => {
    if (!user?.id) return

    try {
      // Load user profile
      const users = await blink.db.users.list({
        where: { id: user.id },
        limit: 1
      })

      if (users.length > 0) {
        const userData = users[0]
        setProfile({
          name: userData.name || '',
          company: userData.company || '',
          timezone: userData.timezone || 'UTC',
          logoUrl: userData.logoUrl || ''
        })
      }

      // Load integrations
      const userIntegrations = await blink.db.userIntegrations.list({
        where: { userId: user.id }
      })

      setIntegrations(userIntegrations)

      // Set integration states
      const emailIntegration = userIntegrations.find(i => i.type === 'gmail' || i.type === 'outlook')
      if (emailIntegration) {
        setEmailSettings({
          provider: emailIntegration.type,
          isConnected: Number(emailIntegration.isActive) > 0,
          email: JSON.parse(emailIntegration.settings || '{}').email || ''
        })
      }

      const linkedinIntegration = userIntegrations.find(i => i.type === 'linkedin')
      if (linkedinIntegration) {
        setLinkedinSettings({
          isConnected: Number(linkedinIntegration.isActive) > 0,
          profileUrl: JSON.parse(linkedinIntegration.settings || '{}').profileUrl || ''
        })
      }

      const calendarIntegration = userIntegrations.find(i => i.type === 'google_calendar' || i.type === 'microsoft_calendar')
      if (calendarIntegration) {
        setCalendarSettings({
          provider: calendarIntegration.type,
          isConnected: Number(calendarIntegration.isActive) > 0,
          calendlyLink: JSON.parse(calendarIntegration.settings || '{}').calendlyLink || ''
        })
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id, loadUserData])

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setSaving(true)
    try {
      // Check if user exists
      const existingUsers = await blink.db.users.list({
        where: { id: user.id },
        limit: 1
      })

      if (existingUsers.length > 0) {
        // Update existing user
        await blink.db.users.update(user.id, {
          name: profile.name,
          company: profile.company,
          timezone: profile.timezone,
          logoUrl: profile.logoUrl,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Create new user record
        await blink.db.users.create({
          id: user.id,
          email: user.email,
          name: profile.name,
          company: profile.company,
          timezone: profile.timezone,
          logoUrl: profile.logoUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      alert('Profile saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectEmail = async (provider: 'gmail' | 'outlook') => {
    try {
      // Initiate real OAuth flow
      const authUrl = await integrationService.initiateOAuthFlow(provider)
      
      // Store the provider for callback handling
      sessionStorage.setItem('oauth_provider', provider)
      
      // Redirect to OAuth provider
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting email:', error)
      alert('Error connecting email. Please try again.')
    }
  }

  const handleConnectLinkedIn = async () => {
    try {
      // Initiate real OAuth flow for LinkedIn
      const authUrl = await integrationService.initiateOAuthFlow('linkedin')
      
      // Store the provider for callback handling
      sessionStorage.setItem('oauth_provider', 'linkedin')
      
      // Redirect to OAuth provider
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting LinkedIn:', error)
      alert('Error connecting LinkedIn. Please try again.')
    }
  }

  const handleSaveCalendlyLink = async () => {
    if (!user?.id || !calendarSettings.calendlyLink.trim()) return

    try {
      await integrationService.connectCalendly(user.id, calendarSettings.calendlyLink)
      
      setCalendarSettings(prev => ({ ...prev, isConnected: true }))
      await loadUserData()
      
      alert('Calendly link saved successfully!')
    } catch (error) {
      console.error('Error saving Calendly link:', error)
      alert('Error saving Calendly link. Please check the URL and try again.')
    }
  }

  const handleDisconnectIntegration = async (type: string) => {
    try {
      const integration = integrations.find(i => i.type === type)
      if (integration) {
        await integrationService.disconnectIntegration(integration.id)

        // Update local state
        if (type === 'gmail' || type === 'outlook') {
          setEmailSettings(prev => ({ ...prev, isConnected: false }))
        } else if (type === 'linkedin') {
          setLinkedinSettings(prev => ({ ...prev, isConnected: false }))
        } else if (type === 'calendly') {
          setCalendarSettings(prev => ({ ...prev, isConnected: false }))
        }

        await loadUserData()
        alert('Integration disconnected successfully!')
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      alert('Error disconnecting integration')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access settings</p>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and integrations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal and company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(value) => 
                    setProfile(prev => ({ ...prev, timezone: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">Company Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  value={profile.logoUrl}
                  onChange={(e) => setProfile(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Email Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Integration
              </CardTitle>
              <CardDescription>
                Connect your email account to send campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailSettings.isConnected ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{emailSettings.provider === 'gmail' ? 'Gmail' : 'Outlook'} Connected</p>
                      <p className="text-sm text-gray-600">{emailSettings.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDisconnectIntegration(emailSettings.provider)}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Connect your email account to send automated campaigns
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => handleConnectEmail('gmail')}>
                      Connect Gmail
                    </Button>
                    <Button variant="outline" onClick={() => handleConnectEmail('outlook')}>
                      Connect Outlook
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LinkedIn Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5" />
                LinkedIn Integration
              </CardTitle>
              <CardDescription>
                Connect LinkedIn to send connection requests and messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedinSettings.isConnected ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">LinkedIn Connected</p>
                      <p className="text-sm text-gray-600">{linkedinSettings.profileUrl}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDisconnectIntegration('linkedin')}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Connect LinkedIn to send automated connection requests and messages
                  </p>
                  <Button onClick={handleConnectLinkedIn}>
                    Connect LinkedIn
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Integration
              </CardTitle>
              <CardDescription>
                Connect your calendar and set up meeting booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="calendlyLink">Calendly Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="calendlyLink"
                    value={calendarSettings.calendlyLink}
                    onChange={(e) => setCalendarSettings(prev => ({ ...prev, calendlyLink: e.target.value }))}
                    placeholder="https://calendly.com/your-username/meeting"
                  />
                  <Button onClick={handleSaveCalendlyLink}>
                    Save
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This link will be included in your campaign messages
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Calendar Providers</p>
                <div className="flex gap-3">
                  <Button variant="outline" disabled>
                    <Calendar className="h-4 w-4 mr-2" />
                    Google Calendar (Coming Soon)
                  </Button>
                  <Button variant="outline" disabled>
                    <Calendar className="h-4 w-4 mr-2" />
                    Microsoft Calendar (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Campaign Updates</p>
                  <p className="text-sm text-gray-600">Get notified when campaigns start, pause, or complete</p>
                </div>
                <Switch
                  checked={notifications.campaignUpdates}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, campaignUpdates: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Meeting Reminders</p>
                  <p className="text-sm text-gray-600">Reminders for upcoming meetings</p>
                </div>
                <Switch
                  checked={notifications.meetingReminders}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, meetingReminders: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-gray-600">Weekly summary of your campaign performance</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <Badge variant="secondary">Verified</Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="font-medium">Connected Integrations</p>
                <div className="space-y-2">
                  {integrations.filter(i => Number(i.isActive) > 0).map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {integration.type === 'gmail' && <Mail className="h-4 w-4" />}
                        {integration.type === 'outlook' && <Mail className="h-4 w-4" />}
                        {integration.type === 'linkedin' && <Linkedin className="h-4 w-4" />}
                        {integration.type === 'calendly' && <Calendar className="h-4 w-4" />}
                        <div>
                          <p className="text-sm font-medium capitalize">{integration.type}</p>
                          <p className="text-xs text-gray-500">
                            Connected {new Date(integration.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDisconnectIntegration(integration.type)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                  {integrations.filter(i => Number(i.isActive) > 0).length === 0 && (
                    <p className="text-sm text-gray-500">No active integrations</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="font-medium">Account Actions</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => blink.auth.logout()}>
                    Sign Out
                  </Button>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}