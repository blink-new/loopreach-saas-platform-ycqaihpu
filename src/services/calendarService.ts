import { blink } from '@/blink/client'

export interface CalendarProvider {
  id: string
  name: string
  type: 'google' | 'microsoft' | 'calendly'
  isConnected: boolean
  settings: {
    accessToken?: string
    refreshToken?: string
    calendarId?: string
    calendlyUrl?: string
    webhookUrl?: string
  }
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  attendees: string[]
  meetingUrl?: string
  location?: string
}

export class CalendarService {
  private providers: CalendarProvider[] = [
    {
      id: 'google',
      name: 'Google Calendar',
      type: 'google',
      isConnected: false,
      settings: {}
    },
    {
      id: 'microsoft',
      name: 'Microsoft Calendar',
      type: 'microsoft',
      isConnected: false,
      settings: {}
    },
    {
      id: 'calendly',
      name: 'Calendly',
      type: 'calendly',
      isConnected: false,
      settings: {}
    }
  ]

  async getProviders(): Promise<CalendarProvider[]> {
    try {
      const user = await blink.auth.me()
      const savedProviders = await blink.db.calendarIntegrations.list({
        where: { userId: user.id }
      })

      return this.providers.map(provider => {
        const saved = savedProviders.find(p => p.provider === provider.type)
        if (saved) {
          return {
            ...provider,
            isConnected: Number(saved.isActive) > 0,
            settings: { ...provider.settings, ...JSON.parse(saved.settings || '{}') }
          }
        }
        return provider
      })
    } catch (error) {
      console.error('Error getting calendar providers:', error)
      return this.providers
    }
  }

  async initiateGoogleOAuth(): Promise<string> {
    try {
      // In a real implementation, this would redirect to Google OAuth
      const clientId = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id'
      const redirectUri = `${window.location.origin}/oauth/callback`
      const scope = 'https://www.googleapis.com/auth/calendar'
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=google_calendar`

      return authUrl
    } catch (error) {
      console.error('Error initiating Google OAuth:', error)
      throw new Error('Failed to initiate Google Calendar connection')
    }
  }

  async initiateMicrosoftOAuth(): Promise<string> {
    try {
      // In a real implementation, this would redirect to Microsoft OAuth
      const clientId = process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id'
      const redirectUri = `${window.location.origin}/oauth/callback`
      const scope = 'https://graph.microsoft.com/calendars.readwrite'
      
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=microsoft_calendar`

      return authUrl
    } catch (error) {
      console.error('Error initiating Microsoft OAuth:', error)
      throw new Error('Failed to initiate Microsoft Calendar connection')
    }
  }

  async connectCalendly(userId: string, calendlyUrl: string): Promise<void> {
    try {
      // Validate Calendly URL
      if (!calendlyUrl.includes('calendly.com')) {
        throw new Error('Invalid Calendly URL')
      }

      // Check if integration already exists
      const existing = await blink.db.calendarIntegrations.list({
        where: { userId, provider: 'calendly' }
      })

      if (existing.length > 0) {
        // Update existing
        await blink.db.calendarIntegrations.update(existing[0].id, {
          calendarUrl: calendlyUrl,
          isActive: true,
          settings: JSON.stringify({ calendlyUrl }),
          updatedAt: new Date().toISOString()
        })
      } else {
        // Create new
        await blink.db.calendarIntegrations.create({
          userId,
          provider: 'calendly',
          calendarUrl: calendlyUrl,
          isActive: true,
          settings: JSON.stringify({ calendlyUrl }),
          createdAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error connecting Calendly:', error)
      throw error
    }
  }

  async handleOAuthCallback(code: string, state: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      
      if (state === 'google_calendar') {
        await this.handleGoogleCallback(user.id, code)
      } else if (state === 'microsoft_calendar') {
        await this.handleMicrosoftCallback(user.id, code)
      } else {
        throw new Error('Invalid OAuth state')
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error)
      throw error
    }
  }

  private async handleGoogleCallback(userId: string, code: string): Promise<void> {
    try {
      // In a real implementation, this would exchange the code for tokens
      // For demo purposes, we'll simulate a successful connection
      
      const mockTokens = {
        accessToken: `google_access_${Date.now()}`,
        refreshToken: `google_refresh_${Date.now()}`,
        expiresIn: 3600
      }

      await blink.db.calendarIntegrations.create({
        userId,
        provider: 'google',
        isActive: true,
        settings: JSON.stringify({
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          calendarId: 'primary'
        }),
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error handling Google callback:', error)
      throw error
    }
  }

  private async handleMicrosoftCallback(userId: string, code: string): Promise<void> {
    try {
      // In a real implementation, this would exchange the code for tokens
      // For demo purposes, we'll simulate a successful connection
      
      const mockTokens = {
        accessToken: `microsoft_access_${Date.now()}`,
        refreshToken: `microsoft_refresh_${Date.now()}`,
        expiresIn: 3600
      }

      await blink.db.calendarIntegrations.create({
        userId,
        provider: 'microsoft',
        isActive: true,
        settings: JSON.stringify({
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          calendarId: 'primary'
        }),
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error handling Microsoft callback:', error)
      throw error
    }
  }

  async createEvent(providerId: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    try {
      const user = await blink.auth.me()
      const integrations = await blink.db.calendarIntegrations.list({
        where: { userId: user.id, provider: providerId }
      })

      if (integrations.length === 0) {
        throw new Error('Calendar provider not connected')
      }

      const integration = integrations[0]
      const settings = JSON.parse(integration.settings || '{}')

      // For demo purposes, create a mock event
      const calendarEvent: CalendarEvent = {
        id: `event_${Date.now()}`,
        ...event
      }

      // In a real implementation, this would create the event via the provider's API
      console.log(`Creating event in ${providerId}:`, calendarEvent)

      return calendarEvent
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  async getEvents(providerId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const user = await blink.auth.me()
      const integrations = await blink.db.calendarIntegrations.list({
        where: { userId: user.id, provider: providerId }
      })

      if (integrations.length === 0) {
        throw new Error('Calendar provider not connected')
      }

      // For demo purposes, return mock events
      const mockEvents: CalendarEvent[] = [
        {
          id: 'event_1',
          title: 'Demo Call with Lead',
          startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
          attendees: ['lead@example.com'],
          meetingUrl: 'https://zoom.us/j/123456789'
        }
      ]

      return mockEvents
    } catch (error) {
      console.error('Error getting calendar events:', error)
      throw error
    }
  }

  async disconnectProvider(providerId: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      const integrations = await blink.db.calendarIntegrations.list({
        where: { userId: user.id, provider: providerId }
      })

      for (const integration of integrations) {
        await blink.db.calendarIntegrations.delete(integration.id)
      }
    } catch (error) {
      console.error('Error disconnecting calendar provider:', error)
      throw error
    }
  }

  async getAvailableSlots(providerId: string, date: Date): Promise<{ start: string; end: string }[]> {
    try {
      // For demo purposes, return mock available slots
      const slots = []
      const baseDate = new Date(date)
      baseDate.setHours(9, 0, 0, 0) // Start at 9 AM

      for (let i = 0; i < 8; i++) { // 8 slots from 9 AM to 5 PM
        const start = new Date(baseDate.getTime() + i * 3600000) // Every hour
        const end = new Date(start.getTime() + 3600000) // 1 hour duration

        slots.push({
          start: start.toISOString(),
          end: end.toISOString()
        })
      }

      return slots
    } catch (error) {
      console.error('Error getting available slots:', error)
      throw error
    }
  }
}

export const calendarService = new CalendarService()