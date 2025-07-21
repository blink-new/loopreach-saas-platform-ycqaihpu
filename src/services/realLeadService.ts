import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'loopreach-saas-platform-ycqaihpu',
  authRequired: true
})

export interface LeadGenerationParams {
  industry: string
  jobTitles: string[]
  companySize: string
  location: string
  keywords?: string[]
  limit?: number
}

export interface GeneratedLead {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  company: string
  industry: string
  location: string
  linkedinUrl?: string
  companyWebsite?: string
  companySize: string
  leadScore: number
  source: string
  verificationStatus: 'verified' | 'pending' | 'invalid'
  lastUpdated: string
}

export class RealLeadService {
  // Generate leads using Apollo.io API
  async generateLeadsWithApollo(params: LeadGenerationParams): Promise<GeneratedLead[]> {
    try {
      const leads: GeneratedLead[] = []
      const limit = params.limit || 50

      console.log('Starting Apollo lead generation with params:', params)

      // Search for people using Apollo API
      for (const jobTitle of params.jobTitles) {
        if (leads.length >= limit) break

        console.log(`Searching for ${jobTitle} in ${params.industry}...`)

        const searchResult = await blink.data.fetch({
          url: 'https://api.apollo.io/v1/mixed_people/search',
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'X-Api-Key': '{{APOLLO_API_KEY}}'
          },
          body: {
            q_keywords: params.keywords?.join(' ') || '',
            person_titles: [jobTitle],
            organization_locations: [params.location],
            organization_num_employees_ranges: [this.mapCompanySize(params.companySize)],
            page: 1,
            per_page: Math.min(25, limit - leads.length)
          }
        })

        console.log(`Apollo API response status: ${searchResult.status}`)
        
        if (searchResult.status === 200 && searchResult.body?.people) {
          console.log(`Found ${searchResult.body.people.length} people from Apollo`);
          for (const person of searchResult.body.people) {
            if (leads.length >= limit) break

            // Verify email with Hunter.io if available
            let verificationStatus: 'verified' | 'pending' | 'invalid' = 'pending'
            if (person.email) {
              const verification = await this.verifyEmailWithHunter(person.email)
              verificationStatus = verification.isValid ? 'verified' : 'invalid'
            }

            const lead: GeneratedLead = {
              id: `apollo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              firstName: person.first_name || 'Unknown',
              lastName: person.last_name || '',
              email: person.email || await this.generateEmail(person.first_name, person.last_name, person.organization?.name),
              jobTitle: person.title || jobTitle,
              company: person.organization?.name || 'Unknown Company',
              industry: params.industry,
              location: person.city || params.location,
              linkedinUrl: person.linkedin_url,
              companyWebsite: person.organization?.website_url,
              companySize: params.companySize,
              leadScore: this.calculateLeadScore(person),
              source: 'Apollo.io',
              verificationStatus,
              lastUpdated: new Date().toISOString()
            }

            leads.push(lead)
          }
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return leads
    } catch (error) {
      console.error('Error generating leads with Apollo:', error)
      
      // Fallback to AI-generated leads if Apollo fails
      console.log('Apollo API failed, falling back to AI-generated leads...')
      return this.generateFallbackLeads(params)
    }
  }

  // Verify email using Hunter.io
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

  // Find email using Hunter.io domain search
  async findEmailWithHunter(firstName: string, lastName: string, domain: string): Promise<string | null> {
    try {
      const result = await blink.data.fetch({
        url: `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key={{HUNTER_API_KEY}}`,
        method: 'GET'
      })

      if (result.status === 200 && result.body?.data?.email) {
        return result.body.data.email
      }

      return null
    } catch (error) {
      console.error('Error finding email with Hunter:', error)
      return null
    }
  }

  // Generate professional email
  async generateEmail(firstName: string, lastName: string, company: string): Promise<string> {
    try {
      if (!firstName || !company) return ''

      // Extract domain from company name
      const domain = company.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 15) + '.com'

      const first = firstName.toLowerCase().replace(/[^a-z]/g, '')
      const last = (lastName || '').toLowerCase().replace(/[^a-z]/g, '')

      // Try to find email with Hunter first
      if (last) {
        const hunterEmail = await this.findEmailWithHunter(first, last, domain)
        if (hunterEmail) return hunterEmail
      }

      // Fallback to common patterns
      const patterns = [
        `${first}.${last}@${domain}`,
        `${first}${last}@${domain}`,
        `${first}@${domain}`,
        `${first[0]}${last}@${domain}`
      ]

      return patterns[0]
    } catch (error) {
      return `${firstName.toLowerCase()}@company.com`
    }
  }

  // Map company size to Apollo format
  mapCompanySize(size: string): string {
    const sizeMap: { [key: string]: string } = {
      '1-10': '1,10',
      '11-50': '11,50',
      '51-200': '51,200',
      '201-500': '201,500',
      '501-1000': '501,1000',
      '1000+': '1001,10000'
    }
    
    return sizeMap[size] || '1,10000'
  }

  // Calculate lead score based on Apollo data
  calculateLeadScore(person: any): number {
    let score = 60 // Base score

    // Job title scoring
    const title = (person.title || '').toLowerCase()
    const seniorTitles = ['ceo', 'cto', 'cfo', 'vp', 'vice president', 'director', 'head', 'chief', 'founder']
    const managerTitles = ['manager', 'lead', 'senior', 'principal']
    
    if (seniorTitles.some(t => title.includes(t))) {
      score += 25
    } else if (managerTitles.some(t => title.includes(t))) {
      score += 15
    }

    // Email availability
    if (person.email) {
      score += 15
    }

    // LinkedIn profile
    if (person.linkedin_url) {
      score += 10
    }

    // Company size (from organization data)
    if (person.organization?.estimated_num_employees > 100) {
      score += 10
    }

    return Math.min(95, Math.max(60, score))
  }

  // Save leads to database
  async saveLeadsToDatabase(leads: GeneratedLead[], userId: string): Promise<void> {
    try {
      const leadsToCreate = leads.map(lead => ({
        id: lead.id,
        userId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        company: lead.company,
        jobTitle: lead.jobTitle,
        phone: '',
        linkedinUrl: lead.linkedinUrl || '',
        website: lead.companyWebsite || '',
        industry: lead.industry,
        score: lead.leadScore,
        status: 'new',
        source: lead.source,
        country: this.extractCountry(lead.location),
        location: lead.location,
        companySize: lead.companySize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      if (leadsToCreate.length > 0) {
        await blink.db.leads.createMany(leadsToCreate);
      }
    } catch (error) {
      if (error.message.includes('constraint')) {
        console.warn('Some leads already exist, skipping duplicates.');
        // Handle duplicates gracefully, maybe by updating existing ones if needed
        // For now, we just ignore them.
        const leadsToUpsert = [];
        for (const lead of leads) {
            try {
                await blink.db.leads.create({
                    id: lead.id,
                    userId,
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    company: lead.company,
                    jobTitle: lead.jobTitle,
                    phone: '',
                    linkedinUrl: lead.linkedinUrl || '',
                    website: lead.companyWebsite || '',
                    industry: lead.industry,
                    score: lead.leadScore,
                    status: 'new',
                    source: lead.source,
                    country: this.extractCountry(lead.location),
                    location: lead.location,
                    companySize: lead.companySize,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } catch (e) {
                // ignore
            }
        }
      } else {
        console.error('Error saving leads to database:', error)
        throw error
      }
    }
  }

  // Extract country from location
  extractCountry(location: string): string {
    const countries = [
      'United States', 'USA', 'US',
      'Canada', 'United Kingdom', 'UK', 'Britain',
      'Germany', 'France', 'Australia', 'India',
      'Singapore', 'Netherlands', 'Sweden', 'Norway'
    ]
    
    const locationLower = location.toLowerCase()
    
    for (const country of countries) {
      if (locationLower.includes(country.toLowerCase())) {
        if (['usa', 'us'].includes(country.toLowerCase())) return 'United States'
        if (['uk', 'britain'].includes(country.toLowerCase())) return 'United Kingdom'
        return country
      }
    }
    
    return 'Unknown'
  }

  // Fallback lead generation using AI when APIs are unavailable
  async generateFallbackLeads(params: LeadGenerationParams): Promise<GeneratedLead[]> {
    try {
      const leads: GeneratedLead[] = []
      const limit = params.limit || 50

      console.log('Generating fallback leads with AI...')

      // Use AI to generate realistic lead data
      for (let i = 0; i < Math.min(limit, 25); i++) {
        const { object } = await blink.ai.generateObject({
          prompt: `Generate a realistic business contact for the ${params.industry} industry. 
          Job title should be one of: ${params.jobTitles.join(', ')}. 
          Location: ${params.location}. 
          Company size: ${params.companySize}.
          Include realistic first name, last name, professional email, company name, and LinkedIn profile.`,
          schema: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
              company: { type: 'string' },
              jobTitle: { type: 'string' },
              linkedinUrl: { type: 'string' },
              companyWebsite: { type: 'string' },
              leadScore: { type: 'number', minimum: 60, maximum: 95 }
            },
            required: ['firstName', 'lastName', 'email', 'company', 'jobTitle', 'leadScore']
          }
        })

        const lead: GeneratedLead = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          firstName: object.firstName,
          lastName: object.lastName,
          email: object.email,
          jobTitle: object.jobTitle,
          company: object.company,
          industry: params.industry,
          location: params.location,
          linkedinUrl: object.linkedinUrl,
          companyWebsite: object.companyWebsite,
          companySize: params.companySize,
          leadScore: object.leadScore,
          source: 'AI Generated',
          verificationStatus: 'pending',
          lastUpdated: new Date().toISOString()
        }

        leads.push(lead)
      }

      console.log(`Generated ${leads.length} AI fallback leads`)
      return leads
    } catch (error) {
      console.error('Error generating fallback leads:', error)
      throw new Error('Failed to generate leads')
    }
  }

  // Main method to generate and save leads
  async generateLeads(params: LeadGenerationParams): Promise<GeneratedLead[]> {
    try {
      const user = await blink.auth.me()
      
      let leads: GeneratedLead[] = []
      let source = 'Apollo.io'
      
      try {
        // Try Apollo first
        leads = await this.generateLeadsWithApollo(params)
      } catch (apolloError) {
        console.log('Apollo failed, using AI fallback...')
        leads = await this.generateFallbackLeads(params)
        source = 'AI Generated'
      }
      
      // Save to database
      await this.saveLeadsToDatabase(leads, user.id)
      
      // Log analytics
      await blink.db.analyticsEvents.create({
        id: `event_${Date.now()}`,
        userId: user.id,
        eventType: 'leads_generated',
        metadata: JSON.stringify({ 
          count: leads.length, 
          source,
          params 
        }),
        createdAt: new Date().toISOString()
      })

      return leads
    } catch (error) {
      console.error('Error in generateLeads:', error)
      throw error
    }
  }

  // Enrich existing lead with Apollo data
  async enrichLead(leadId: string): Promise<boolean> {
    try {
      const user = await blink.auth.me()
      
      // Get existing lead
      const leads = await blink.db.leads.list({
        where: { id: leadId, userId: String(user.id) }
      })
      
      if (leads.length === 0) {
        throw new Error('Lead not found')
      }
      
      const lead = leads[0]
      
      // Use Apollo to enrich
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
          linkedinUrl: apolloData.linkedin_url || lead.linkedin_url,
          linkedin_url: apolloData.linkedin_url || lead.linkedin_url,
          title: apolloData.title || lead.title,
          job_title: apolloData.title || lead.job_title,
          score: Math.min(100, (lead.score || 0) + 10),
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Error enriching lead:', error)
      return false
    }
  }
}

export const realLeadService = new RealLeadService()