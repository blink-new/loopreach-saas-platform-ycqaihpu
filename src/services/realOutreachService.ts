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
  first_name: string
  last_name: string
  email: string
  company_name: string
  job_title: string
  linkedin_url?: string
  score: number
  status: 'new' | 'contacted' | 'replied' | 'meeting_booked' | 'closed'
  user_id: string
  created_at: string
}

export class RealOutreachService {
  // Create a new outreach campaign
  async createCampaign(campaignData: Omit<OutreachCampaign, 'id' | 'createdAt' | 'userId' | 'sentCount' | 'openRate' | 'replyRate'>): Promise<OutreachCampaign> {
    try {
      const user = await blink.auth.me()
      
      const campaign = await blink.db.outreachCampaigns.create({
        id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: campaignData.name,
        subject: campaignData.subject,
        message: campaignData.message,
        status: campaignData.status,
        lead_ids: JSON.stringify(campaignData.leadIds),
        template_id: 'default',
        email_provider: 'sendgrid',
        sent_count: 0,
        open_rate: 0,
        reply_rate: 0,
        user_id: user.id,
        created_at: new Date().toISOString()
      })

      return campaign
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw new Error('Failed to create campaign')
    }
  }

  // Get all campaigns for the current user
  async getCampaigns(): Promise<OutreachCampaign[]> {
    try {
      const user = await blink.auth.me()
      
      const campaigns = await blink.db.outreachCampaigns.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })

      // Map database fields to interface fields
      return campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject || '',
        message: campaign.message || '',
        status: campaign.status,
        leadIds: campaign.lead_ids ? JSON.parse(campaign.lead_ids) : [],
        sentCount: campaign.sent_count || 0,
        openRate: campaign.open_rate || 0,
        replyRate: campaign.reply_rate || 0,
        createdAt: campaign.created_at || '',
        userId: campaign.user_id || ''
      }))
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      throw new Error('Failed to fetch campaigns')
    }
  }

  // Launch a campaign using real email APIs
  async launchCampaign(campaignId: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      
      // Get campaign details
      const campaigns = await blink.db.outreachCampaigns.list({
        where: { id: campaignId, user_id: user.id }
      })
      
      if (campaigns.length === 0) {
        throw new Error('Campaign not found')
      }
      
      const campaign = campaigns[0]
      const leadIds = campaign.lead_ids ? JSON.parse(campaign.lead_ids) : []
      
      // Get leads for this campaign
      const leads = await blink.db.leads.list({
        where: { 
          AND: [
            { user_id: user.id },
            { id: { in: leadIds } }
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
          campaign_id: campaign.id,
          lead_id: lead.id,
          template_id: 'default',
          subject: personalizedSubject,
          body: personalizedMessage,
          message: personalizedMessage,
          status: 'scheduled',
          scheduled_at: new Date().toISOString(),
          user_id: user.id
        })
      })

      await Promise.all(emailPromises)

      // Update campaign status to active
      await blink.db.outreachCampaigns.update(campaignId, {
        status: 'active'
      })

      // Process emails immediately using real APIs
      await this.processScheduledEmails()
      
    } catch (error) {
      console.error('Error launching campaign:', error)
      throw new Error('Failed to launch campaign')
    }
  }

  // Process scheduled emails using real email APIs
  async processScheduledEmails(): Promise<void> {
    try {
      const user = await blink.auth.me()
      
      // Get scheduled emails
      const scheduledEmails = await blink.db.outreachEmails.list({
        where: { 
          AND: [
            { user_id: user.id },
            { status: 'scheduled' }
          ]
        },
        limit: 10 // Process in batches
      })

      for (const email of scheduledEmails) {
        try {
          // Get lead details
          const leads = await blink.db.leads.list({
            where: { id: email.lead_id }
          })
          
          if (leads.length === 0) continue
          
          const lead = leads[0]
          
          // Send email using SendGrid API through Blink's secure proxy
          const result = await blink.data.fetch({
            url: 'https://api.sendgrid.com/v3/mail/send',
            method: 'POST',
            headers: {
              'Authorization': 'Bearer {{SENDGRID_API_KEY}}',
              'Content-Type': 'application/json'
            },
            body: {
              from: {
                email: 'outreach@loopreach.io',
                name: 'Loopreach.io Outreach'
              },
              personalizations: [{
                to: [{
                  email: lead.email || lead.first_name + '@' + (lead.company_name || 'company.com').toLowerCase().replace(/\s+/g, '') + '.com',
                  name: `${lead.first_name || ''} ${lead.last_name || ''}`
                }],
                subject: email.subject
              }],
              content: [{
                type: 'text/html',
                value: this.formatEmailHtml(email.message, lead)
              }, {
                type: 'text/plain',
                value: email.message
              }]
            }
          })

          if (result.status === 202) {
            // Update email status to sent
            await blink.db.outreachEmails.update(email.id, {
              status: 'sent',
              sent_at: new Date().toISOString()
            })

            // Update lead status
            await blink.db.leads.update(lead.id, {
              status: 'contacted',
              last_contacted: new Date().toISOString()
            })

            // Update campaign stats
            await this.updateCampaignStats(email.campaign_id)
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
  }

  // Update campaign statistics
  async updateCampaignStats(campaignId: string): Promise<void> {
    try {
      const emails = await blink.db.outreachEmails.list({
        where: { campaign_id: campaignId }
      })

      const sentCount = emails.filter(e => e.status === 'sent').length
      const openedCount = emails.filter(e => e.status === 'opened').length
      const repliedCount = emails.filter(e => e.status === 'replied').length

      const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0
      const replyRate = sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0

      await blink.db.outreachCampaigns.update(campaignId, {
        sent_count: sentCount,
        open_rate: openRate,
        reply_rate: replyRate
      })
    } catch (error) {
      console.error('Error updating campaign stats:', error)
    }
  }

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
  }

  // Personalize message with lead data
  personalizeMessage(template: string, lead: any): string {
    const firstName = lead.first_name || 'there';
    const lastName = lead.last_name || '';
    const company = lead.company_name || 'your company';
    const title = lead.job_title || 'your role';

    const fullName = [firstName === 'there' ? null : firstName, lastName]
      .filter(Boolean)
      .join(' ');

    return template
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{lastName\}\}/g, lastName)
      .replace(/\{\{company\}\}/g, company)
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{fullName\}\}/g, fullName.trim());
  }

  // Format email as HTML
  formatEmailHtml(message: string, lead: any): string {
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
  }

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
  }

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
            { campaign_id: campaignId },
            { user_id: user.id }
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
  }

  // LinkedIn outreach using LinkedIn API
  async sendLinkedInMessage(leadId: string, message: string): Promise<boolean> {
    try {
      const user = await blink.auth.me()
      
      // Get lead details
      const leads = await blink.db.leads.list({
        where: { id: leadId, user_id: user.id }
      })
      
      if (leads.length === 0) {
        throw new Error('Lead not found')
      }
      
      const lead = leads[0]
      
      // Use LinkedIn API through Blink's secure proxy
      const result = await blink.data.fetch({
        url: 'https://api.linkedin.com/v2/messages',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{LINKEDIN_ACCESS_TOKEN}}',
          'Content-Type': 'application/json'
        },
        body: {
          recipients: [lead.linkedinUrl || lead.linkedin_url],
          message: this.personalizeMessage(message, lead)
        }
      })

      if (result.status === 201) {
        // Log the LinkedIn message
        await blink.db.linkedinMessages.create({
          id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lead_id: lead.id,
          message: this.personalizeMessage(message, lead),
          status: 'sent',
          sent_at: new Date().toISOString(),
          user_id: user.id
        })

        // Update lead status
        await blink.db.leads.update(lead.id, {
          status: 'contacted',
          last_contacted: new Date().toISOString()
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Error sending LinkedIn message:', error)
      return false
    }
  }

  // Apollo.io integration for lead enrichment
  async enrichLeadWithApollo(leadId: string): Promise<boolean> {
    try {
      const user = await blink.auth.me()
      
      // Get lead details
      const leads = await blink.db.leads.list({
        where: { id: leadId, user_id: user.id }
      })
      
      if (leads.length === 0) {
        throw new Error('Lead not found')
      }
      
      const lead = leads[0]
      
      // Use Apollo API to enrich lead data
      const result = await blink.data.fetch({
        url: 'https://api.apollo.io/v1/people/match',
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'X-Api-Key': '{{APOLLO_API_KEY}}'
        },
        body: {
          first_name: lead.first_name || lead.firstName,
          last_name: lead.last_name || lead.lastName,
          organization_name: lead.company_name || lead.company,
          email: lead.email
        }
      })

      if (result.status === 200 && result.body?.person) {
        const apolloData = result.body.person
        
        // Update lead with enriched data
        await blink.db.leads.update(lead.id, {
          email: apolloData.email || lead.email,
          phone: apolloData.phone_numbers?.[0]?.sanitized_number || lead.phone,
          linkedin_url: apolloData.linkedin_url || lead.linkedin_url,
          job_title: apolloData.title || lead.job_title || lead.title,
          score: Math.min(100, (lead.score || 0) + 10) // Boost score for enriched leads
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Error enriching lead with Apollo:', error)
      return false
    }
  }

  // Hunter.io email verification
  async verifyEmailWithHunter(email: string): Promise<{
    isValid: boolean
    deliverable: boolean
    score: number
  }> {
    try {
      const result = await blink.data.fetch({
        url: `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key={{HUNTER_API_KEY}}`,
        method: 'GET'
      })

      if (result.status === 200 && result.body?.data) {
        const hunterData = result.body.data
        
        return {
          isValid: hunterData.result === 'deliverable',
          deliverable: hunterData.result === 'deliverable',
          score: hunterData.score || 0
        }
      }

      return {
        isValid: false,
        deliverable: false,
        score: 0
      }
    } catch (error) {
      console.error('Error verifying email with Hunter:', error)
      return {
        isValid: false,
        deliverable: false,
        score: 0
      }
    }
  }
}

export const realOutreachService = new RealOutreachService()