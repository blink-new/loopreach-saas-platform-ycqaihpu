import { blink } from '../blink/client'

export interface DashboardStats {
  totalLeads: number
  meetingsBooked: number
  activeCampaigns: number
  totalCampaigns: number
  emailsSent: number
  openRate: number
  replyRate: number
  meetingRate: number
  leadsByIndustry: { industry: string; count: number }[]
  leadsByLocation: { location: string; count: number }[]
  campaignPerformance: {
    campaignId: string
    name: string
    sentCount: number
    openedCount: number
    repliedCount: number
    meetingsBooked: number
    openRate: number
    replyRate: number
  }[]
  recentActivity: {
    type: string
    description: string
    timestamp: string
  }[]
}

export interface MeetingData {
  id: string
  title: string
  leadName: string
  companyName: string
  startTime: string
  endTime: string
  status: string
  campaignName?: string
}

export class AnalyticsService {
  public async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get total leads
      const leads = await blink.db.leads.list({
        where: { userId }
      })

      // Get campaigns
      const campaigns = await blink.db.campaigns.list({
        where: { userId }
      })

      // Get meetings
      const meetings = await blink.db.meetings.list({
        where: { userId }
      })

      // Get messages
      const messages = await blink.db.messages.list({
        where: { userId }
      })

      // Calculate stats
      const totalLeads = leads.length
      const meetingsBooked = meetings.length
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length
      const totalCampaigns = campaigns.length
      const emailsSent = messages.filter(m => m.type === 'email').length

      // Calculate rates
      const openedMessages = messages.filter(m => m.openedAt).length
      const repliedMessages = messages.filter(m => m.repliedAt).length
      
      const openRate = emailsSent > 0 ? (openedMessages / emailsSent) * 100 : 0
      const replyRate = emailsSent > 0 ? (repliedMessages / emailsSent) * 100 : 0
      const meetingRate = emailsSent > 0 ? (meetingsBooked / emailsSent) * 100 : 0

      // Leads by industry
      const industryMap = new Map<string, number>()
      leads.forEach(lead => {
        const industry = lead.industry || 'Unknown'
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1)
      })
      const leadsByIndustry = Array.from(industryMap.entries())
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Leads by location
      const locationMap = new Map<string, number>()
      leads.forEach(lead => {
        const location = lead.country || 'Unknown'
        locationMap.set(location, (locationMap.get(location) || 0) + 1)
      })
      const leadsByLocation = Array.from(locationMap.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Campaign performance
      const campaignPerformance = campaigns.map(campaign => {
        const campaignMessages = messages.filter(m => m.campaignId === campaign.id)
        const campaignOpened = campaignMessages.filter(m => m.openedAt).length
        const campaignReplied = campaignMessages.filter(m => m.repliedAt).length
        const campaignMeetings = meetings.filter(m => m.campaignId === campaign.id).length

        return {
          campaignId: campaign.id,
          name: campaign.name,
          sentCount: campaign.sentCount || 0,
          openedCount: campaignOpened,
          repliedCount: campaignReplied,
          meetingsBooked: campaignMeetings,
          openRate: campaign.sentCount > 0 ? (campaignOpened / campaign.sentCount) * 100 : 0,
          replyRate: campaign.sentCount > 0 ? (campaignReplied / campaign.sentCount) * 100 : 0
        }
      }).sort((a, b) => b.sentCount - a.sentCount)

      // Recent activity
      const recentActivity = await this.getRecentActivity(userId)

      return {
        totalLeads,
        meetingsBooked,
        activeCampaigns,
        totalCampaigns,
        emailsSent,
        openRate,
        replyRate,
        meetingRate,
        leadsByIndustry,
        leadsByLocation,
        campaignPerformance,
        recentActivity
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalLeads: 0,
        meetingsBooked: 0,
        activeCampaigns: 0,
        totalCampaigns: 0,
        emailsSent: 0,
        openRate: 0,
        replyRate: 0,
        meetingRate: 0,
        leadsByIndustry: [],
        leadsByLocation: [],
        campaignPerformance: [],
        recentActivity: []
      }
    }
  }

  private async getRecentActivity(userId: string): Promise<any[]> {
    try {
      const events = await blink.db.analyticsEvents.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })

      return events.map(event => ({
        type: event.eventType,
        description: this.formatEventDescription(event.eventType, event.metadata),
        timestamp: event.createdAt
      }))
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }

  private formatEventDescription(eventType: string, metadata?: string): string {
    const data = metadata ? JSON.parse(metadata) : {}

    switch (eventType) {
      case 'lead_generated':
        return `Generated ${data.count || 1} new leads`
      case 'email_sent':
        return 'Sent email to lead'
      case 'linkedin_sent':
        return 'Sent LinkedIn message to lead'
      case 'email_opened':
        return 'Lead opened email'
      case 'reply_received':
        return 'Received reply from lead'
      case 'meeting_booked':
        return 'Meeting booked with lead'
      case 'campaign_created':
        return `Created campaign: ${data.name || 'Untitled'}`
      case 'campaign_launched':
        return `Launched campaign: ${data.name || 'Untitled'}`
      default:
        return eventType.replace(/_/g, ' ')
    }
  }

  public async getMeetings(userId: string): Promise<MeetingData[]> {
    try {
      const meetings = await blink.db.meetings.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      const meetingsWithDetails = []

      for (const meeting of meetings) {
        // Get lead details
        const leads = await blink.db.leads.list({
          where: { id: meeting.leadId },
          limit: 1
        })

        // Get campaign details if available
        let campaignName = undefined
        if (meeting.campaignId) {
          const campaigns = await blink.db.campaigns.list({
            where: { id: meeting.campaignId },
            limit: 1
          })
          campaignName = campaigns[0]?.name
        }

        const lead = leads[0]
        if (lead) {
          meetingsWithDetails.push({
            id: meeting.id,
            title: meeting.title || meeting.meetingTitle || 'Meeting',
            leadName: lead.name || `${lead.firstName} ${lead.lastName}`,
            companyName: lead.companyName || lead.company || 'Unknown',
            startTime: meeting.startTime || meeting.meetingTime || meeting.createdAt,
            endTime: meeting.endTime || meeting.startTime || meeting.meetingTime || meeting.createdAt,
            status: meeting.status,
            campaignName
          })
        }
      }

      return meetingsWithDetails
    } catch (error) {
      console.error('Error getting meetings:', error)
      return []
    }
  }

  public async logEvent(userId: string, eventType: string, entityId?: string, metadata?: any): Promise<void> {
    try {
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.analyticsEvents.create({
        id: eventId,
        userId,
        eventType,
        entityId: entityId || '',
        metadata: metadata ? JSON.stringify(metadata) : '',
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging event:', error)
    }
  }

  public async trackEmailOpen(messageId: string): Promise<void> {
    try {
      // Update message
      await blink.db.messages.update(messageId, {
        status: 'opened',
        openedAt: new Date().toISOString()
      })

      // Get message details for analytics
      const messages = await blink.db.messages.list({
        where: { id: messageId },
        limit: 1
      })

      if (messages.length > 0) {
        const message = messages[0]
        
        // Log analytics event
        await this.logEvent(message.userId, 'email_opened', message.campaignId, {
          messageId,
          leadId: message.leadId
        })

        // Update campaign stats
        if (message.campaignId) {
          const campaigns = await blink.db.campaigns.list({
            where: { id: message.campaignId },
            limit: 1
          })

          if (campaigns.length > 0) {
            const campaign = campaigns[0]
            await blink.db.campaigns.update(campaign.id, {
              openedCount: (campaign.openedCount || 0) + 1,
              updatedAt: new Date().toISOString()
            })
          }
        }
      }
    } catch (error) {
      console.error('Error tracking email open:', error)
    }
  }

  public async trackReply(messageId: string, replyContent: string): Promise<void> {
    try {
      // Update message
      await blink.db.messages.update(messageId, {
        status: 'replied',
        repliedAt: new Date().toISOString(),
        replyContent
      })

      // Get message details
      const messages = await blink.db.messages.list({
        where: { id: messageId },
        limit: 1
      })

      if (messages.length > 0) {
        const message = messages[0]
        
        // Log analytics event
        await this.logEvent(message.userId, 'reply_received', message.campaignId, {
          messageId,
          leadId: message.leadId,
          replyContent: replyContent.substring(0, 100) // First 100 chars
        })

        // Update campaign stats
        if (message.campaignId) {
          const campaigns = await blink.db.campaigns.list({
            where: { id: message.campaignId },
            limit: 1
          })

          if (campaigns.length > 0) {
            const campaign = campaigns[0]
            await blink.db.campaigns.update(campaign.id, {
              repliedCount: (campaign.repliedCount || 0) + 1,
              updatedAt: new Date().toISOString()
            })
          }
        }

        // Update lead status
        await blink.db.leads.update(message.leadId, {
          status: 'replied',
          lastContacted: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error tracking reply:', error)
    }
  }

  public async bookMeeting(userId: string, leadId: string, campaignId: string | null, meetingData: any): Promise<string> {
    try {
      const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.meetings.create({
        id: meetingId,
        userId,
        leadId,
        campaignId: campaignId || '',
        title: meetingData.title || 'Sales Meeting',
        meetingTitle: meetingData.title || 'Sales Meeting',
        description: meetingData.description || '',
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        meetingTime: meetingData.startTime,
        timezone: meetingData.timezone || 'UTC',
        meetingUrl: meetingData.meetingUrl || '',
        status: 'scheduled',
        source: campaignId ? 'campaign' : 'manual'
      })

      // Update lead status
      await blink.db.leads.update(leadId, {
        status: 'meeting_booked',
        updatedAt: new Date().toISOString()
      })

      // Log analytics event
      await this.logEvent(userId, 'meeting_booked', campaignId, {
        meetingId,
        leadId,
        startTime: meetingData.startTime
      })

      // Update campaign stats if applicable
      if (campaignId) {
        const campaigns = await blink.db.campaigns.list({
          where: { id: campaignId },
          limit: 1
        })

        if (campaigns.length > 0) {
          const campaign = campaigns[0]
          await blink.db.campaigns.update(campaign.id, {
            meetingsBooked: (campaign.meetingsBooked || 0) + 1,
            updatedAt: new Date().toISOString()
          })
        }
      }

      return meetingId
    } catch (error) {
      console.error('Error booking meeting:', error)
      throw error
    }
  }
}

export const analyticsService = new AnalyticsService()