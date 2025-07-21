import { blink } from '../blink/client'

export interface Integration {
  id: string
  userId: string
  type: 'gmail' | 'outlook' | 'linkedin' | 'google_calendar' | 'microsoft_calendar' | 'calendly'
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  settings: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export class IntegrationService {
  public async connectCalendly(userId: string, calendlyUrl: string): Promise<Integration> {
    try {
      // Validate Calendly URL
      if (!calendlyUrl.includes('calendly.com')) {
        throw new Error('Invalid Calendly URL')
      }
      
      const integrationId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const integration: Integration = {
        id: integrationId,
        userId,
        type: 'calendly',
        settings: {
          calendlyUrl: calendlyUrl,
          connectedAt: new Date().toISOString()
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await blink.db.userIntegrations.create({
        id: integrationId,
        userId,
        type: 'calendly',
        accessToken: '',
        refreshToken: '',
        expiresAt: '',
        settings: JSON.stringify(integration.settings),
        isActive: 1,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      })
      
      return integration
    } catch (error) {
      console.error('Error connecting Calendly:', error)
      throw error
    }
  }

  public async disconnectIntegration(integrationId: string): Promise<void> {
    try {
      await blink.db.userIntegrations.update(integrationId, {
        isActive: 0,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      throw error
    }
  }

  public async getIntegrationStatus(userId: string): Promise<{
    email: { connected: boolean; provider?: string; email?: string }
    linkedin: { connected: boolean; profileUrl?: string }
    calendar: { connected: boolean; provider?: string; url?: string }
  }> {
    try {
      const integrations = await blink.db.userIntegrations.list({
        where: { 
          userId,
          isActive: 1
        },
        orderBy: { createdAt: 'desc' }
      })
      
      const emailIntegration = integrations.find(i => i.type === 'gmail' || i.type === 'outlook')
      const linkedinIntegration = integrations.find(i => i.type === 'linkedin')
      const calendarIntegration = integrations.find(i => i.type === 'calendly' || i.type === 'google_calendar' || i.type === 'microsoft_calendar')
      
      return {
        email: {
          connected: !!emailIntegration,
          provider: emailIntegration?.type,
          email: emailIntegration?.settings ? JSON.parse(emailIntegration.settings).email : undefined
        },
        linkedin: {
          connected: !!linkedinIntegration,
          profileUrl: linkedinIntegration?.settings ? JSON.parse(linkedinIntegration.settings).profileUrl : undefined
        },
        calendar: {
          connected: !!calendarIntegration,
          provider: calendarIntegration?.type,
          url: calendarIntegration?.settings ? JSON.parse(calendarIntegration.settings).calendlyUrl : undefined
        }
      }
    } catch (error) {
      console.error('Error getting integration status:', error)
      return {
        email: { connected: false },
        linkedin: { connected: false },
        calendar: { connected: false }
      }
    }
  }

  public async initiateOAuthFlow(provider: 'gmail' | 'outlook' | 'linkedin'): Promise<string> {
    try {
      const baseUrls = {
        gmail: 'https://accounts.google.com/o/oauth2/v2/auth',
        outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        linkedin: 'https://www.linkedin.com/oauth/v2/authorization'
      }

      // Use environment variables for client IDs
      const clientIds = {
        gmail: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
        outlook: process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
        linkedin: process.env.LINKEDIN_CLIENT_ID || 'your-linkedin-client-id'
      }

      const scopes = {
        gmail: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
        outlook: 'https://graph.microsoft.com/mail.send https://graph.microsoft.com/user.read',
        linkedin: 'r_liteprofile r_emailaddress w_member_social'
      }

      const redirectUri = `${window.location.origin}/oauth/callback`
      
      const authUrl = `${baseUrls[provider]}?` +
        `client_id=${clientIds[provider]}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes[provider])}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${provider}`

      return authUrl
    } catch (error) {
      console.error('Error initiating OAuth flow:', error)
      throw new Error('Failed to initiate OAuth flow')
    }
  }

  public async handleOAuthCallback(code: string, provider: string): Promise<Integration> {
    try {
      const user = await blink.auth.me()
      
      // In a real implementation, this would exchange the code for tokens
      // For now, we'll simulate a successful OAuth exchange
      
      const integrationId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Simulate token exchange
      const mockTokens = {
        accessToken: `${provider}_access_${Date.now()}`,
        refreshToken: `${provider}_refresh_${Date.now()}`,
        expiresIn: 3600
      }
      
      // Simulate user info retrieval
      const mockUserInfo = {
        email: `user@${provider === 'gmail' ? 'gmail.com' : provider === 'outlook' ? 'outlook.com' : 'linkedin.com'}`,
        name: 'Connected User',
        profileUrl: provider === 'linkedin' ? 'https://linkedin.com/in/user' : ''
      }
      
      const integration: Integration = {
        id: integrationId,
        userId: user.id,
        type: provider as any,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        expiresAt: new Date(Date.now() + mockTokens.expiresIn * 1000).toISOString(),
        settings: mockUserInfo,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await blink.db.userIntegrations.create({
        id: integrationId,
        userId: user.id,
        type: provider,
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken || '',
        expiresAt: integration.expiresAt || '',
        settings: JSON.stringify(integration.settings),
        isActive: 1,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      })
      
      return integration
    } catch (error) {
      console.error('Error handling OAuth callback:', error)
      throw new Error('Failed to complete OAuth flow')
    }
  }
}

export const integrationService = new IntegrationService()