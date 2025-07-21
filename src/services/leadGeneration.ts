import { blink } from '../blink/client'

export interface LeadFilters {
  industry?: string
  location?: string
  jobTitle?: string
  companySize?: string
  keywords?: string
  limit?: number
}

export interface Lead {
  id?: string
  name: string
  jobTitle: string
  email: string
  companyName: string
  companySize: string
  industry: string
  linkedinUrl: string
  country: string
  location: string
  phone?: string
  website?: string
  score: number
}

export class LeadGenerationService {
  private async searchLinkedInProfiles(filters: LeadFilters): Promise<any[]> {
    try {
      // Use Blink's web search to find LinkedIn profiles
      const searchQuery = this.buildSearchQuery(filters)
      
      const searchResults = await blink.data.search(searchQuery, {
        type: 'all',
        limit: filters.limit || 50
      })

      const linkedinProfiles = searchResults.organic_results?.filter(result => 
        result.link?.includes('linkedin.com/in/') || 
        result.title?.toLowerCase().includes('linkedin')
      ) || []

      return linkedinProfiles
    } catch (error) {
      console.error('Error searching LinkedIn profiles:', error)
      return []
    }
  }

  private buildSearchQuery(filters: LeadFilters): string {
    const parts = ['site:linkedin.com/in/']
    
    if (filters.jobTitle) {
      parts.push(`"${filters.jobTitle}"`)
    }
    
    if (filters.industry) {
      parts.push(`"${filters.industry}"`)
    }
    
    if (filters.location) {
      parts.push(`"${filters.location}"`)
    }
    
    if (filters.keywords) {
      parts.push(filters.keywords)
    }

    return parts.join(' ')
  }

  private async enrichLeadData(profileUrl: string): Promise<Partial<Lead> | null> {
    try {
      // Scrape LinkedIn profile data
      const scrapedData = await blink.data.scrape(profileUrl)
      
      if (!scrapedData.markdown) {
        return null
      }

      // Extract information using AI
      const { object: leadData } = await blink.ai.generateObject({
        prompt: `Extract lead information from this LinkedIn profile data: ${scrapedData.markdown}`,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            jobTitle: { type: 'string' },
            companyName: { type: 'string' },
            location: { type: 'string' },
            industry: { type: 'string' },
            companySize: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' }
          }
        }
      })

      // Generate email if not found
      let email = leadData.email
      if (!email && leadData.name && leadData.companyName) {
        email = await this.generateEmail(leadData.name, leadData.companyName)
      }

      return {
        name: leadData.name || 'Unknown',
        jobTitle: leadData.jobTitle || 'Unknown',
        email: email || '',
        companyName: leadData.companyName || 'Unknown',
        companySize: leadData.companySize || 'Unknown',
        industry: leadData.industry || 'Unknown',
        linkedinUrl: profileUrl,
        location: leadData.location || 'Unknown',
        country: this.extractCountry(leadData.location || ''),
        phone: leadData.phone || '',
        score: this.calculateLeadScore(leadData)
      }
    } catch (error) {
      console.error('Error enriching lead data:', error)
      return null
    }
  }

  private async generateEmail(name: string, company: string): Promise<string> {
    try {
      // Common email patterns
      const firstName = name.split(' ')[0]?.toLowerCase()
      const lastName = name.split(' ').slice(1).join('')?.toLowerCase()
      const domain = await this.getCompanyDomain(company)

      if (!firstName || !domain) return ''

      // Try common patterns
      const patterns = [
        `${firstName}.${lastName}@${domain}`,
        `${firstName}${lastName}@${domain}`,
        `${firstName}@${domain}`,
        `${firstName[0]}${lastName}@${domain}`
      ]

      // Return the most likely pattern (first one)
      return patterns[0]
    } catch (error) {
      return ''
    }
  }

  private async getCompanyDomain(companyName: string): Promise<string> {
    try {
      const searchResults = await blink.data.search(`${companyName} official website`, {
        type: 'all',
        limit: 5
      })

      const officialSite = searchResults.organic_results?.find(result => 
        result.title?.toLowerCase().includes(companyName.toLowerCase()) ||
        result.snippet?.toLowerCase().includes('official')
      )

      if (officialSite?.link) {
        const url = new URL(officialSite.link)
        return url.hostname.replace('www.', '')
      }

      // Fallback: generate domain from company name
      return companyName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10) + '.com'
    } catch (error) {
      return companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
    }
  }

  private extractCountry(location: string): string {
    const countries = [
      'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
      'Australia', 'India', 'Singapore', 'Netherlands', 'Sweden'
    ]
    
    for (const country of countries) {
      if (location.toLowerCase().includes(country.toLowerCase())) {
        return country
      }
    }
    
    return 'Unknown'
  }

  private calculateLeadScore(leadData: any): number {
    let score = 50 // Base score

    // Job title scoring
    const seniorTitles = ['ceo', 'cto', 'cfo', 'vp', 'director', 'head', 'manager']
    if (seniorTitles.some(title => leadData.jobTitle?.toLowerCase().includes(title))) {
      score += 20
    }

    // Company size scoring
    if (leadData.companySize?.includes('1000+') || leadData.companySize?.includes('large')) {
      score += 15
    } else if (leadData.companySize?.includes('100-1000') || leadData.companySize?.includes('medium')) {
      score += 10
    }

    // Email availability
    if (leadData.email) {
      score += 15
    }

    return Math.min(100, Math.max(0, score))
  }

  public async generateLeads(userId: string, filters: LeadFilters): Promise<Lead[]> {
    try {
      // Create job record
      const jobId = `job_${Date.now()}`
      await blink.db.leadGenerationJobs.create({
        id: jobId,
        userId,
        status: 'running',
        filters: JSON.stringify(filters),
        startedAt: new Date().toISOString()
      })

      // Search for LinkedIn profiles
      const profiles = await this.searchLinkedInProfiles(filters)
      const leads: Lead[] = []

      // Process each profile
      for (const profile of profiles.slice(0, filters.limit || 20)) {
        try {
          const enrichedLead = await this.enrichLeadData(profile.link)
          
          if (enrichedLead && enrichedLead.name && enrichedLead.name !== 'Unknown') {
            const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            const lead: Lead = {
              id: leadId,
              ...enrichedLead,
              name: enrichedLead.name!,
              jobTitle: enrichedLead.jobTitle!,
              email: enrichedLead.email!,
              companyName: enrichedLead.companyName!,
              companySize: enrichedLead.companySize!,
              industry: enrichedLead.industry!,
              linkedinUrl: enrichedLead.linkedinUrl!,
              country: enrichedLead.country!,
              location: enrichedLead.location!,
              score: enrichedLead.score!
            }

            // Save to database
            await blink.db.leads.create({
              id: leadId,
              userId,
              name: lead.name,
              jobTitle: lead.jobTitle,
              email: lead.email,
              companyName: lead.companyName,
              companySize: lead.companySize,
              industry: lead.industry,
              linkedinUrl: lead.linkedinUrl,
              country: lead.country,
              location: lead.location,
              phone: lead.phone || '',
              website: lead.website || '',
              score: lead.score,
              source: 'generated',
              createdAt: new Date().toISOString()
            })

            leads.push(lead)

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.error('Error processing profile:', error)
          continue
        }
      }

      // Update job status
      await blink.db.leadGenerationJobs.update(jobId, {
        status: 'completed',
        totalLeads: leads.length,
        processedLeads: profiles.length,
        completedAt: new Date().toISOString()
      })

      // Log analytics event
      await blink.db.analyticsEvents.create({
        id: `event_${Date.now()}`,
        userId,
        eventType: 'lead_generated',
        metadata: JSON.stringify({ count: leads.length, filters })
      })

      return leads
    } catch (error) {
      console.error('Error generating leads:', error)
      throw error
    }
  }

  public async getLeadsByUser(userId: string, filters?: any): Promise<Lead[]> {
    try {
      const whereClause: any = { userId }
      
      if (filters?.status) {
        whereClause.status = filters.status
      }
      
      if (filters?.industry) {
        whereClause.industry = filters.industry
      }

      const leads = await blink.db.leads.list({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        limit: 1000
      })

      return leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        jobTitle: lead.jobTitle || '',
        email: lead.email || '',
        companyName: lead.companyName || '',
        companySize: lead.companySize || '',
        industry: lead.industry || '',
        linkedinUrl: lead.linkedinUrl || '',
        country: lead.country || '',
        location: lead.location || '',
        phone: lead.phone || '',
        website: lead.website || '',
        score: lead.score || 0
      }))
    } catch (error) {
      console.error('Error fetching leads:', error)
      return []
    }
  }
}

export const leadGenerationService = new LeadGenerationService()