import { blink } from '../blink/client'

export interface Campaign {
  id: string
  name: string
  description?: string
  type: 'email' | 'linkedin' | 'mixed'
  status: 'draft' | 'active' | 'paused' | 'completed'
  emailSubject?: string
  emailTemplate?: string
  linkedinMessage?: string
  followUpDelay: number
  followUpTemplate?: string
  calendlyLink?: string
  totalLeads: number
  sentCount: number
  openedCount: number
  repliedCount: number
  meetingsBooked: number
}

export interface CampaignMessage {
  type: 'email' | 'linkedin'
  subject?: string
  content: string
  isFollowUp?: boolean
}

export class CampaignService {
  public async generateAIMessages(
    companyInfo: string,
    targetAudience: string,
    campaignGoal: string,
    leadExample?: any
  ): Promise<CampaignMessage[]> {
    try {
      const { object: messages } = await blink.ai.generateObject({
        prompt: `Generate personalized outreach messages for a B2B campaign.
        
        Company Info: ${companyInfo}
        Target Audience: ${targetAudience}
        Campaign Goal: ${campaignGoal}
        ${leadExample ? `Example Lead: ${JSON.stringify(leadExample)}` : ''}
        
        Create messages that are:
        - Professional but conversational
        - Value-focused (what's in it for them)
        - Include a clear call-to-action
        - Personalized with placeholders like {{firstName}}, {{companyName}}, {{jobTitle}}
        - Not overly salesy
        - Include calendar booking link: {{calendlyLink}}`,
        schema: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['email', 'linkedin'] },
                  subject: { type: 'string' },
                  content: { type: 'string' },
                  isFollowUp: { type: 'boolean' }
                }
              }
            }
          }
        }
      })

      return messages.messages || []
    } catch (error) {
      console.error('Error generating AI messages:', error)
      return []
    }
  }

  public async createCampaign(userId: string, campaignData: Partial<Campaign>): Promise<string> {
    try {
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.campaigns.create({
        id: campaignId,
        userId,
        name: campaignData.name || 'Untitled Campaign',
        description: campaignData.description || '',
        type: campaignData.type || 'email',
        status: 'draft',
        emailSubject: campaignData.emailSubject || '',
        emailTemplate: campaignData.emailTemplate || '',
        linkedinMessage: campaignData.linkedinMessage || '',
        followUpDelay: campaignData.followUpDelay || 3,
        followUpTemplate: campaignData.followUpTemplate || '',
        calendlyLink: campaignData.calendlyLink || '',
        totalLeads: 0,
        sentCount: 0,
        openedCount: 0,
        repliedCount: 0,
        meetingsBooked: 0,
        createdAt: new Date().toISOString()
      })

      return campaignId
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  }

  public async addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<void> {
    try {
      for (const leadId of leadIds) {
        const relationId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        await blink.db.campaignLeads.create({
          id: relationId,
          campaignId,
          leadId,
          status: 'pending',
          followUpCount: 0,
          createdAt: new Date().toISOString()
        })
      }

      // Update campaign total leads count
      await blink.db.campaigns.update(campaignId, {
        totalLeads: leadIds.length,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error adding leads to campaign:', error)
      throw error
    }
  }

  public async launchCampaign(campaignId: string): Promise<void> {
    try {
      const user = await blink.auth.me();
      if (!user) throw new Error('User not authenticated');

      // Update campaign status
      await blink.db.campaigns.update(campaignId, {
        status: 'active',
        updatedAt: new Date().toISOString()
      });

      // Get campaign details
      const campaigns = await blink.db.campaigns.list({
        where: { id: campaignId, userId: user.id },
        limit: 1
      });

      if (campaigns.length === 0) {
        throw new Error('Campaign not found or not owned by user');
      }

      const campaign = campaigns[0];

      // Get campaign leads
      const campaignLeads = await blink.db.campaignLeads.list({
        where: { campaignId: campaign.id, status: 'pending' }
      });

      // Send initial messages
      for (const campaignLead of campaignLeads) {
        await this.sendMessage(campaign, campaignLead.leadId, false);
        
        // Add delay between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error launching campaign:', error);
      throw new Error('Failed to launch campaign');
    }
  }

  private async sendMessage(campaign: any, leadId: string, isFollowUp: boolean = false): Promise<void> {
    try {
      // Get lead details
      const leads = await blink.db.leads.list({
        where: { id: leadId },
        limit: 1
      })

      if (leads.length === 0) return

      const lead = leads[0]

      // Personalize message
      const template = isFollowUp ? campaign.followUpTemplate : campaign.emailTemplate
      const subject = campaign.emailSubject

      const personalizedContent = this.personalizeMessage(template, lead, campaign.calendlyLink)
      const personalizedSubject = this.personalizeMessage(subject, lead)

      // Create message record
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.messages.create({
        id: messageId,
        userId: campaign.userId,
        campaignId: campaign.id,
        leadId,
        type: campaign.type === 'linkedin' ? 'linkedin' : 'email',
        subject: personalizedSubject,
        content: personalizedContent,
        status: 'sent',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      })

      // Update campaign lead status
      await blink.db.campaignLeads.update(`rel_${campaign.id}_${leadId}`, {
        status: 'sent',
        sentAt: new Date().toISOString(),
        followUpCount: isFollowUp ? 1 : 0
      })

      // Update campaign stats
      const currentSentCount = campaign.sentCount || 0
      await blink.db.campaigns.update(campaign.id, {
        sentCount: currentSentCount + 1,
        updatedAt: new Date().toISOString()
      })

      // Log analytics
      await blink.db.analyticsEvents.create({
        id: `event_${Date.now()}`,
        userId: campaign.userId,
        eventType: campaign.type === 'linkedin' ? 'linkedin_sent' : 'email_sent',
        entityId: campaign.id,
        metadata: JSON.stringify({ leadId, isFollowUp })
      })

    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  private personalizeMessage(template: string, lead: any, calendlyLink?: string): string {
    if (!template) return ''
    if (!lead) return template

    // Safely extract lead data with proper fallbacks
    const leadName = String(lead.name || lead.firstName || lead.first_name || '')
    const firstName = leadName.split(' ')[0] || 'there'
    const lastName = leadName.split(' ').slice(1).join(' ') || ''
    const companyName = String(lead.companyName || lead.company || lead.company_name || 'your company')
    const jobTitle = String(lead.jobTitle || lead.job_title || lead.title || 'your role')
    const industry = String(lead.industry || 'your industry')
    const location = String(lead.location || 'your area')
    const safeCalendlyLink = String(calendlyLink || '')

    let personalized = template
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{lastName\}\}/g, lastName)
      .replace(/\{\{fullName\}\}/g, leadName || 'there')
      .replace(/\{\{companyName\}\}/g, companyName)
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{industry\}\}/g, industry)
      .replace(/\{\{location\}\}/g, location)

    if (safeCalendlyLink) {
      personalized = personalized.replace(/\{\{calendlyLink\}\}/g, safeCalendlyLink)
    }

    return personalized
  }

  public async getCampaignsByUser(userId: string): Promise<Campaign[]> {
    try {
      const campaigns = await blink.db.campaigns.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        type: campaign.type as 'email' | 'linkedin' | 'mixed',
        status: campaign.status as 'draft' | 'active' | 'paused' | 'completed',
        emailSubject: campaign.emailSubject,
        emailTemplate: campaign.emailTemplate,
        linkedinMessage: campaign.linkedinMessage,
        followUpDelay: campaign.followUpDelay || 3,
        followUpTemplate: campaign.followUpTemplate,
        calendlyLink: campaign.calendlyLink,
        totalLeads: campaign.totalLeads || 0,
        sentCount: campaign.sentCount || 0,
        openedCount: campaign.openedCount || 0,
        repliedCount: campaign.repliedCount || 0,
        meetingsBooked: campaign.meetingsBooked || 0
      }))
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      return []
    }
  }

  public async scheduleFollowUps(): Promise<void> {
    try {
      // Get campaigns that need follow-ups
      const campaigns = await blink.db.campaigns.list({
        where: { status: 'active' }
      })

      for (const campaign of campaigns) {
        // Get leads that were sent initial message and need follow-up
        const campaignLeads = await blink.db.campaignLeads.list({
          where: { 
            campaignId: campaign.id,
            status: 'sent'
          }
        })

        for (const campaignLead of campaignLeads) {
          const sentDate = new Date(campaignLead.sentAt)
          const followUpDate = new Date(sentDate.getTime() + (campaign.followUpDelay * 24 * 60 * 60 * 1000))
          
          if (new Date() >= followUpDate && campaignLead.followUpCount === 0) {
            await this.sendMessage(campaign, campaignLead.leadId, true)
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling follow-ups:', error)
    }
  }
}

export const campaignService = new CampaignService()