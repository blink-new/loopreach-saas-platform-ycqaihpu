import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'loopreach-saas-platform-ycqaihpu',
  authRequired: true
})

export interface OutreachCampaign {
  id: string
  name: string
  subject: string
  message: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  leadIds: string[]
  sentCount: number
  openRate: number
  replyRate: number
  createdAt: string
  userId: string
}

export interface OutreachEmail {
  id: string
  campaignId: string
  leadId: string
  subject: string
  message: string
  status: 'scheduled' | 'sent' | 'opened' | 'replied' | 'failed'
  scheduledAt: string
  sentAt?: string
  openedAt?: string
  repliedAt?: string
  userId: string
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  title: string
  linkedinUrl?: string
  score: number
  status: 'new' | 'contacted' | 'replied' | 'meeting_booked' | 'closed'
  userId: string
  createdAt: string
}

export const outreachService = {
  // Create a new outreach campaign
  async createCampaign(campaignData: Omit<OutreachCampaign, 'id' | 'createdAt' | 'userId' | 'sentCount' | 'openRate' | 'replyRate'>): Promise<OutreachCampaign> {
    try {
      const user = await blink.auth.me()
      
      const campaign = await blink.db.outreachCampaigns.create({
        id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...campaignData,
        sentCount: 0,
        openRate: 0,
        replyRate: 0,
        userId: user.id,
        createdAt: new Date().toISOString()
      })

      return campaign
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw new Error('Failed to create campaign')
    }
  },

  // Get all campaigns for the current user
  async getCampaigns(): Promise<OutreachCampaign[]> {
    try {
      const user = await blink.auth.me()
      
      const campaigns = await blink.db.outreachCampaigns.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      return campaigns
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      throw new Error('Failed to fetch campaigns')
    }
  },

  // Launch a campaign (schedule emails for all leads)
  async launchCampaign(campaignId: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      
      // Get campaign details
      const campaigns = await blink.db.outreachCampaigns.list({
        where: { id: campaignId, userId: user.id }
      })
      
      if (campaigns.length === 0) {
        throw new Error('Campaign not found')
      }
      
      const campaign = campaigns[0]
      
      // Get leads for this campaign
      const leads = await blink.db.leads.list({
        where: { 
          AND: [
            { userId: user.id },
            { id: { in: campaign.leadIds } }
          ]
        }
      })

      // Create scheduled emails for each lead
      const emailPromises = leads.map(async (lead) => {
        // Personalize the message
        const personalizedMessage = this.personalizeMessage(campaign.message, lead)
        const personalizedSubject = this.personalizeMessage(campaign.subject, lead)
        
        return blink.db.outreachEmails.create({
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          campaignId: campaign.id,
          leadId: lead.id,
          subject: personalizedSubject,
          message: personalizedMessage,
          status: 'scheduled',
          scheduledAt: new Date().toISOString(),
          userId: user.id
        })
      })

      await Promise.all(emailPromises)

      // Update campaign status to active
      await blink.db.outreachCampaigns.update(campaignId, {
        status: 'active'
      })

      // Process emails immediately (in real app, this would be handled by a background job)
      await this.processScheduledEmails()
      
    } catch (error) {
      console.error('Error launching campaign:', error)
      throw new Error('Failed to launch campaign')
    }
  },

  // Process scheduled emails (this would typically run as a background job)
  async processScheduledEmails(): Promise<void> {
    try {
      const user = await blink.auth.me()
      
      // Get scheduled emails
      const scheduledEmails = await blink.db.outreachEmails.list({
        where: { 
          AND: [
            { userId: user.id },
            { status: 'scheduled' }
          ]
        },
        limit: 10 // Process in batches
      })

      for (const email of scheduledEmails) {
        try {
          // Get lead details
          const leads = await blink.db.leads.list({
            where: { id: email.leadId }
          })
          
          if (leads.length === 0) continue
          
          const lead = leads[0]
          
          // Send email using Blink's notification service
          const result = await blink.notifications.email({
            to: lead.email,
            subject: email.subject,
            html: this.formatEmailHtml(email.message, lead),
            text: email.message
          })

          if (result.success) {
            // Update email status to sent
            await blink.db.outreachEmails.update(email.id, {
              status: 'sent',
              sentAt: new Date().toISOString()
            })

            // Update lead status
            await blink.db.leads.update(lead.id, {
              status: 'contacted'
            })
          } else {
            // Mark as failed
            await blink.db.outreachEmails.update(email.id, {
              status: 'failed'
            })
          }
        } catch (emailError) {
          console.error(`Error sending email ${email.id}:`, emailError)
          await blink.db.outreachEmails.update(email.id, {
            status: 'failed'
          })
        }
      }
    } catch (error) {
      console.error('Error processing scheduled emails:', error)
    }
  },

  // Get campaign statistics
  async getCampaignStats(campaignId: string): Promise<{
    totalEmails: number
    sentEmails: number
    openedEmails: number
    repliedEmails: number
    failedEmails: number
  }> {
    try {
      const user = await blink.auth.me()
      
      const emails = await blink.db.outreachEmails.list({
        where: { 
          AND: [
            { campaignId },
            { userId: user.id }
          ]
        }
      })

      return {
        totalEmails: emails.length,
        sentEmails: emails.filter(e => e.status === 'sent').length,
        openedEmails: emails.filter(e => e.status === 'opened').length,
        repliedEmails: emails.filter(e => e.status === 'replied').length,
        failedEmails: emails.filter(e => e.status === 'failed').length
      }
    } catch (error) {
      console.error('Error getting campaign stats:', error)
      return {
        totalEmails: 0,
        sentEmails: 0,
        openedEmails: 0,
        repliedEmails: 0,
        failedEmails: 0
      }
    }
  },

  // Generate AI-powered outreach message
  async generateOutreachMessage(prompt: string, tone: 'professional' | 'casual' | 'friendly' = 'professional'): Promise<{
    subject: string
    message: string
  }> {
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Generate a cold outreach email based on this prompt: "${prompt}". 
        
        Tone: ${tone}
        
        Requirements:
        - Subject line should be compelling and personalized
        - Message should be concise (under 150 words)
        - Include personalization tokens like {{firstName}}, {{company}}, {{title}}
        - Focus on value proposition
        - Include a clear call-to-action
        - Professional but human tone`,
        schema: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Email subject line with personalization tokens'
            },
            message: {
              type: 'string',
              description: 'Email body with personalization tokens and clear CTA'
            }
          },
          required: ['subject', 'message']
        }
      })

      return object
    } catch (error) {
      console.error('Error generating outreach message:', error)
      throw new Error('Failed to generate outreach message')
    }
  },

  // Personalize message with lead data
  personalizeMessage(template: string, lead: Lead): string {
    return template
      .replace(/\{\{firstName\}\}/g, lead.firstName)
      .replace(/\{\{lastName\}\}/g, lead.lastName)
      .replace(/\{\{company\}\}/g, lead.company)
      .replace(/\{\{title\}\}/g, lead.title)
      .replace(/\{\{fullName\}\}/g, `${lead.firstName} ${lead.lastName}`)
  },

  // Format email as HTML
  formatEmailHtml(message: string, lead: Lead): string {
    const formattedMessage = message.replace(/\n/g, '<br>')
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 20px;">
          ${formattedMessage}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This email was sent via Loopreach.io</p>
          <p>If you'd like to unsubscribe, please reply with "UNSUBSCRIBE"</p>
        </div>
      </div>
    `
  },

  // Pause a campaign
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await blink.db.outreachCampaigns.update(campaignId, {
        status: 'paused'
      })
    } catch (error) {
      console.error('Error pausing campaign:', error)
      throw new Error('Failed to pause campaign')
    }
  },

  // Resume a campaign
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await blink.db.outreachCampaigns.update(campaignId, {
        status: 'active'
      })
    } catch (error) {
      console.error('Error resuming campaign:', error)
      throw new Error('Failed to resume campaign')
    }
  }
}