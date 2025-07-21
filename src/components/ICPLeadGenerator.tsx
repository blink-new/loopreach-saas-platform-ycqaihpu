import React, { useState, useEffect, useCallback } from 'react'
import { Target, Sparkles, Building2, Users, MapPin, DollarSign, Code, X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@blinkdotnew/sdk'
import { realLeadService, type LeadGenerationParams } from '@/services/realLeadService'

const blink = createClient({
  projectId: 'loopreach-saas-platform-ycqaihpu',
  authRequired: true
})

interface ICPProfile {
  id: string
  userId: string
  name: string
  description?: string
  targetIndustries: string[]
  companySizeMin?: number
  companySizeMax?: number
  jobTitles: string[]
  locations: string[]
  technologies: string[]
  revenueMin?: number
  revenueMax?: number
  keywords: string[]
  exclusions: string[]
  createdAt: string
}

interface LeadGenerationRequest {
  id: string
  userId: string
  icpProfileId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedCount: number
  generatedCount: number
  createdAt: string
  completedAt?: string
}

const ICPLeadGenerator: React.FC = () => {
  const [icpProfiles, setIcpProfiles] = useState<ICPProfile[]>([])
  const [generationRequests, setGenerationRequests] = useState<LeadGenerationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ICPProfile | null>(null)
  const [leadCount, setLeadCount] = useState(100)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    targetIndustries: [] as string[],
    companySizeMin: '',
    companySizeMax: '',
    jobTitles: [] as string[],
    locations: [] as string[],
    technologies: [] as string[],
    revenueMin: '',
    revenueMax: '',
    keywords: [] as string[],
    exclusions: [] as string[]
  })

  const [tempInputs, setTempInputs] = useState({
    industry: '',
    jobTitle: '',
    location: '',
    technology: '',
    keyword: '',
    exclusion: ''
  })

  const loadData = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      
      // Load ICP profiles
      const profiles = await blink.db.icpProfiles.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Parse JSON fields
      const parsedProfiles = profiles.map(profile => ({
        ...profile,
        targetIndustries: JSON.parse(profile.targetIndustries || '[]'),
        jobTitles: JSON.parse(profile.jobTitles || '[]'),
        locations: JSON.parse(profile.locations || '[]'),
        technologies: JSON.parse(profile.technologies || '[]'),
        keywords: JSON.parse(profile.keywords || '[]'),
        exclusions: JSON.parse(profile.exclusions || '[]')
      }))
      
      setIcpProfiles(parsedProfiles)
      
      // Load generation requests
      const requests = await blink.db.leadGenerationRequests.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })
      
      setGenerationRequests(requests)
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load ICP profiles. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addToArray = (field: keyof typeof tempInputs, arrayField: keyof typeof newProfile) => {
    const value = tempInputs[field].trim()
    if (value && !newProfile[arrayField].includes(value)) {
      setNewProfile(prev => ({
        ...prev,
        [arrayField]: [...prev[arrayField], value]
      }))
      setTempInputs(prev => ({ ...prev, [field]: '' }))
    }
  }

  const removeFromArray = (arrayField: keyof typeof newProfile, index: number) => {
    setNewProfile(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].filter((_, i) => i !== index)
    }))
  }

  const handleCreateProfile = async () => {
    try {
      const user = await blink.auth.me()
      
      const profile = {
        userId: user.id,
        name: newProfile.name,
        description: newProfile.description,
        targetIndustries: JSON.stringify(newProfile.targetIndustries),
        companySizeMin: newProfile.companySizeMin ? parseInt(newProfile.companySizeMin) : null,
        companySizeMax: newProfile.companySizeMax ? parseInt(newProfile.companySizeMax) : null,
        jobTitles: JSON.stringify(newProfile.jobTitles),
        locations: JSON.stringify(newProfile.locations),
        technologies: JSON.stringify(newProfile.technologies),
        revenueMin: newProfile.revenueMin ? parseInt(newProfile.revenueMin) : null,
        revenueMax: newProfile.revenueMax ? parseInt(newProfile.revenueMax) : null,
        keywords: JSON.stringify(newProfile.keywords),
        exclusions: JSON.stringify(newProfile.exclusions)
      }
      
      await blink.db.icpProfiles.create(profile)
      
      toast({
        title: "Success!",
        description: "ICP profile created successfully."
      })
      
      setIsCreateOpen(false)
      setNewProfile({
        name: '',
        description: '',
        targetIndustries: [],
        companySizeMin: '',
        companySizeMax: '',
        jobTitles: [],
        locations: [],
        technologies: [],
        revenueMin: '',
        revenueMax: '',
        keywords: [],
        exclusions: []
      })
      
      loadData()
      
    } catch (error) {
      console.error('Error creating profile:', error)
      toast({
        title: "Error",
        description: "Failed to create ICP profile. Please try again.",
        variant: "destructive"
      })
    }
  }

  const generateLeads = async () => {
    if (!selectedProfile) return
    
    try {
      setGenerating(true)
      const user = await blink.auth.me()
      
      // Create generation request
      const request = {
        userId: user.id,
        icpProfileId: selectedProfile.id,
        requestedCount: leadCount,
        status: 'processing' as const
      }
      
      const createdRequest = await blink.db.leadGenerationRequests.create(request)
      
      // Map company size to standard format
      const mapCompanySize = (min?: number, max?: number): string => {
        if (!min && !max) return '1-10'
        if (min && max) {
          if (max <= 10) return '1-10'
          if (max <= 50) return '11-50'
          if (max <= 200) return '51-200'
          if (max <= 500) return '201-500'
          if (max <= 1000) return '501-1000'
          return '1000+'
        }
        if (min && min > 1000) return '1000+'
        return '1-10'
      }
      
      // Prepare parameters for real lead generation
      const params: LeadGenerationParams = {
        industry: selectedProfile.targetIndustries[0] || 'Technology',
        jobTitles: selectedProfile.jobTitles,
        companySize: mapCompanySize(selectedProfile.companySizeMin, selectedProfile.companySizeMax),
        location: selectedProfile.locations[0] || 'United States',
        keywords: selectedProfile.keywords,
        limit: leadCount
      }
      
      // Generate leads using Apollo.io and Hunter.io APIs
      const generatedLeads = await realLeadService.generateLeads(params)
      
      // Update generation request
      await blink.db.leadGenerationRequests.update(createdRequest.id, {
        status: 'completed',
        generatedCount: generatedLeads.length,
        completedAt: new Date().toISOString()
      })
      
      toast({
        title: "Success!",
        description: `Generated ${generatedLeads.length} verified leads using Apollo.io and Hunter.io APIs.`
      })
      
      setIsGenerateOpen(false)
      setSelectedProfile(null)
      loadData()
      
    } catch (error) {
      console.error('Error generating leads:', error)
      
      // Update request status to failed
      try {
        const user = await blink.auth.me()
        const failedRequests = await blink.db.leadGenerationRequests.list({
          where: { 
            AND: [
              { userId: user.id },
              { status: 'processing' }
            ]
          },
          orderBy: { createdAt: 'desc' },
          limit: 1
        })
        
        if (failedRequests.length > 0) {
          await blink.db.leadGenerationRequests.update(failedRequests[0].id, {
            status: 'failed',
            completedAt: new Date().toISOString()
          })
        }
      } catch (updateError) {
        console.error('Error updating failed request:', updateError)
      }
      
      toast({
        title: "Generation Failed",
        description: "Failed to generate leads with Apollo/Hunter APIs. Please check your API keys and try again.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">AI Lead Generation</h2>
          <p className="text-gray-600">Generate qualified leads based on your Ideal Customer Profile</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create ICP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Ideal Customer Profile</DialogTitle>
                <DialogDescription>
                  Define your target customer criteria to generate qualified leads
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="company">Company Criteria</TabsTrigger>
                  <TabsTrigger value="contact">Contact Criteria</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Profile Name *</Label>
                    <Input
                      id="name"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                      placeholder="e.g., SaaS Startups"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProfile.description}
                      onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                      placeholder="Describe your ideal customer profile..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="company" className="space-y-4">
                  <div>
                    <Label>Target Industries</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tempInputs.industry}
                        onChange={(e) => setTempInputs({...tempInputs, industry: e.target.value})}
                        placeholder="e.g., Software, Healthcare"
                        onKeyPress={(e) => e.key === 'Enter' && addToArray('industry', 'targetIndustries')}
                      />
                      <Button type="button" onClick={() => addToArray('industry', 'targetIndustries')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProfile.targetIndustries.map((industry, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {industry}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('targetIndustries', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companySizeMin">Min Company Size</Label>
                      <Input
                        id="companySizeMin"
                        type="number"
                        value={newProfile.companySizeMin}
                        onChange={(e) => setNewProfile({...newProfile, companySizeMin: e.target.value})}
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companySizeMax">Max Company Size</Label>
                      <Input
                        id="companySizeMax"
                        type="number"
                        value={newProfile.companySizeMax}
                        onChange={(e) => setNewProfile({...newProfile, companySizeMax: e.target.value})}
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Locations</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tempInputs.location}
                        onChange={(e) => setTempInputs({...tempInputs, location: e.target.value})}
                        placeholder="e.g., United States, Europe"
                        onKeyPress={(e) => e.key === 'Enter' && addToArray('location', 'locations')}
                      />
                      <Button type="button" onClick={() => addToArray('location', 'locations')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProfile.locations.map((location, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {location}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('locations', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Technologies Used</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tempInputs.technology}
                        onChange={(e) => setTempInputs({...tempInputs, technology: e.target.value})}
                        placeholder="e.g., Salesforce, HubSpot"
                        onKeyPress={(e) => e.key === 'Enter' && addToArray('technology', 'technologies')}
                      />
                      <Button type="button" onClick={() => addToArray('technology', 'technologies')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProfile.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tech}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('technologies', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4">
                  <div>
                    <Label>Target Job Titles</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tempInputs.jobTitle}
                        onChange={(e) => setTempInputs({...tempInputs, jobTitle: e.target.value})}
                        placeholder="e.g., CEO, VP Sales, Marketing Director"
                        onKeyPress={(e) => e.key === 'Enter' && addToArray('jobTitle', 'jobTitles')}
                      />
                      <Button type="button" onClick={() => addToArray('jobTitle', 'jobTitles')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProfile.jobTitles.map((title, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {title}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('jobTitles', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Keywords</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tempInputs.keyword}
                        onChange={(e) => setTempInputs({...tempInputs, keyword: e.target.value})}
                        placeholder="e.g., growth, scaling, automation"
                        onKeyPress={(e) => e.key === 'Enter' && addToArray('keyword', 'keywords')}
                      />
                      <Button type="button" onClick={() => addToArray('keyword', 'keywords')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProfile.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('keywords', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Exclusions</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={tempInputs.exclusion}
                        onChange={(e) => setTempInputs({...tempInputs, exclusion: e.target.value})}
                        placeholder="e.g., competitors, certain industries"
                        onKeyPress={(e) => e.key === 'Enter' && addToArray('exclusion', 'exclusions')}
                      />
                      <Button type="button" onClick={() => addToArray('exclusion', 'exclusions')}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newProfile.exclusions.map((exclusion, index) => (
                        <Badge key={index} variant="destructive" className="flex items-center gap-1">
                          {exclusion}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('exclusions', index)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProfile} disabled={!newProfile.name}>
                  Create Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button disabled={icpProfiles.length === 0}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Leads
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Qualified Leads</DialogTitle>
                <DialogDescription>
                  Select an ICP profile and specify how many leads to generate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select ICP Profile</Label>
                  <Select onValueChange={(value) => {
                    const profile = icpProfiles.find(p => p.id === value)
                    setSelectedProfile(profile || null)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an ICP profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {icpProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProfile && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{selectedProfile.name}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Industries:</span> {selectedProfile.targetIndustries.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Job Titles:</span> {selectedProfile.jobTitles.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Locations:</span> {selectedProfile.locations.join(', ')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div>
                  <Label htmlFor="leadCount">Number of Leads</Label>
                  <Select value={leadCount.toString()} onValueChange={(value) => setLeadCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 leads</SelectItem>
                      <SelectItem value="100">100 leads</SelectItem>
                      <SelectItem value="250">250 leads</SelectItem>
                      <SelectItem value="500">500 leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={generateLeads} 
                  disabled={!selectedProfile || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {leadCount} Leads
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ICP Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {icpProfiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{profile.name}</CardTitle>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              {profile.description && (
                <CardDescription>{profile.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Industries</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.targetIndustries.slice(0, 3).map((industry, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                  {profile.targetIndustries.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.targetIndustries.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Job Titles</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.jobTitles.slice(0, 2).map((title, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {title}
                    </Badge>
                  ))}
                  {profile.jobTitles.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.jobTitles.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Locations</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {profile.locations.slice(0, 2).map((location, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {location}
                    </Badge>
                  ))}
                  {profile.locations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.locations.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  setSelectedProfile(profile)
                  setIsGenerateOpen(true)
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Leads
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {icpProfiles.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ICP Profiles Yet</h3>
              <p className="text-gray-500 text-center mb-4">
                Create your first Ideal Customer Profile to start generating qualified leads with AI.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First ICP
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Generation Requests */}
      {generationRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Lead Generation</CardTitle>
            <CardDescription>Track your AI lead generation requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generationRequests.map((request) => {
                const profile = icpProfiles.find(p => p.id === request.icpProfileId)
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`h-3 w-3 rounded-full ${
                        request.status === 'completed' ? 'bg-green-500' :
                        request.status === 'processing' ? 'bg-yellow-500' :
                        request.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium">{profile?.name || 'Unknown Profile'}</p>
                        <p className="text-sm text-gray-500">
                          {request.status === 'completed' 
                            ? `Generated ${request.generatedCount} of ${request.requestedCount} leads`
                            : `Requested ${request.requestedCount} leads`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'processing' ? 'secondary' :
                        request.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {request.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ICPLeadGenerator