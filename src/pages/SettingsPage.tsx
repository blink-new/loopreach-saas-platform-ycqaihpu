import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Separator } from '../components/ui/separator'
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Key,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface UserProfile {
  id: string
  email: string
  displayName: string
  company?: string
  title?: string
  timezone?: string
  emailSignature?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  campaignUpdates: boolean
  meetingReminders: boolean
  weeklyReports: boolean
  marketingEmails: boolean
}

interface IntegrationSettings {
  calendlyUrl?: string
  hubspotConnected: boolean
  pipedriveConnected: boolean
  slackWebhook?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState({
    displayName: '',
    company: '',
    title: '',
    timezone: 'America/New_York',
    emailSignature: ''
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    campaignUpdates: true,
    meetingReminders: true,
    weeklyReports: true,
    marketingEmails: false
  })
  const [integrations, setIntegrations] = useState<IntegrationSettings>({
    calendlyUrl: '',
    hubspotConnected: false,
    pipedriveConnected: false,
    slackWebhook: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      const userData = await blink.auth.me()
      setUser(userData)
      
      // Load user profile
      setProfile({
        displayName: userData.displayName || '',
        company: userData.company || '',
        title: userData.title || '',
        timezone: userData.timezone || 'America/New_York',
        emailSignature: userData.emailSignature || ''
      })

      // Load notification settings (would come from database in real app)
      // For now, using defaults

      // Load integration settings
      const calendarIntegrations = await blink.db.calendarIntegrations.list({
        where: { userId: userData.id, provider: 'calendly' },
        limit: 1
      })
      
      if (calendarIntegrations.length > 0) {
        setIntegrations(prev => ({
          ...prev,
          calendlyUrl: calendarIntegrations[0].calendarUrl || ''
        }))
      }

    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await blink.auth.updateMe({
        displayName: profile.displayName,
        company: profile.company,
        title: profile.title,
        timezone: profile.timezone,
        emailSignature: profile.emailSignature
      })

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully."
      })

    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      // In a real app, this would save to a user_settings table
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved."
      })
    } catch (error) {
      console.error('Error saving notifications:', error)
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIntegrations = async () => {
    setSaving(true)
    try {
      if (integrations.calendlyUrl && user) {
        // Update or create Calendly integration
        const existingIntegrations = await blink.db.calendarIntegrations.list({
          where: { userId: user.id, provider: 'calendly' }
        })

        if (existingIntegrations.length > 0) {
          await blink.db.calendarIntegrations.update(existingIntegrations[0].id, {
            calendarUrl: integrations.calendlyUrl
          })
        } else {
          await blink.db.calendarIntegrations.create({
            userId: user.id,
            provider: 'calendly',
            calendarUrl: integrations.calendlyUrl,
            isActive: true
          })
        }
      }

      toast({
        title: "Integrations Updated",
        description: "Your integration settings have been saved."
      })

    } catch (error) {
      console.error('Error saving integrations:', error)
      toast({
        title: "Error",
        description: "Failed to save integration settings.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Account deletion is not available in the demo. Contact support for assistance.",
      variant: "destructive"
    })
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]

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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and integrations</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={profile.title}
                    onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Your job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signature">Email Signature</Label>
                <Textarea
                  id="signature"
                  value={profile.emailSignature}
                  onChange={(e) => setProfile(prev => ({ ...prev, emailSignature: e.target.value }))}
                  placeholder="Your email signature..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Campaign Updates</Label>
                    <p className="text-sm text-gray-500">Get notified when campaigns start, pause, or complete</p>
                  </div>
                  <Switch
                    checked={notifications.campaignUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, campaignUpdates: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Meeting Reminders</Label>
                    <p className="text-sm text-gray-500">Reminders for upcoming meetings with leads</p>
                  </div>
                  <Switch
                    checked={notifications.meetingReminders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, meetingReminders: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-gray-500">Weekly summary of your campaign performance</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-500">Product updates and marketing communications</p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketingEmails: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Calendar Integration
                </CardTitle>
                <CardDescription>
                  Connect your calendar for automatic meeting booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calendly">Calendly URL</Label>
                  <Input
                    id="calendly"
                    value={integrations.calendlyUrl}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, calendlyUrl: e.target.value }))}
                    placeholder="https://calendly.com/your-username/meeting"
                  />
                  <p className="text-xs text-gray-500">
                    Enter your Calendly scheduling link to enable automatic meeting booking
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CRM Integrations</CardTitle>
                <CardDescription>
                  Connect your CRM to sync leads and activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-600">H</span>
                    </div>
                    <div>
                      <div className="font-medium">HubSpot</div>
                      <div className="text-sm text-gray-500">Sync leads and deals</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {integrations.hubspotConnected ? 'Connected' : 'Connect'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">P</span>
                    </div>
                    <div>
                      <div className="font-medium">Pipedrive</div>
                      <div className="text-sm text-gray-500">Sync leads and pipeline</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {integrations.pipedriveConnected ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slack Integration</CardTitle>
                <CardDescription>
                  Get notifications in Slack when leads reply or meetings are booked
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slack">Slack Webhook URL</Label>
                  <Input
                    id="slack"
                    value={integrations.slackWebhook}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, slackWebhook: e.target.value }))}
                    placeholder="https://hooks.slack.com/services/..."
                    type="password"
                  />
                  <p className="text-xs text-gray-500">
                    Create a webhook in your Slack workspace and paste the URL here
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveIntegrations} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Integrations'}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="space-y-6">
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium">Email Verified</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Verified
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">Password</div>
                      <div className="text-sm text-gray-500">Last updated 30 days ago</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="h-8 w-8 text-gray-600" />
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500">Not enabled</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-900">Delete Account</div>
                    <div className="text-sm text-red-700">
                      Permanently delete your account and all associated data
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}