import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Mail, 
  Linkedin, 
  Building, 
  MapPin, 
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react'
import { blink } from '@/blink/client'
import { realLeadGeneration, type GeneratedLead, type LeadGenerationParams } from '@/services/realLeadGeneration'
import { toast } from 'sonner'

export default function LeadsPage() {
  const [leads, setLeads] = useState<GeneratedLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<GeneratedLead[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [generationParams, setGenerationParams] = useState<LeadGenerationParams>({
    industry: '',
    jobTitles: [],
    companySize: '',
    location: '',
    keywords: [],
    limit: 50
  })

  const loadLeads = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      const dbLeads = await blink.db.leads.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      
      // Map database fields (snake_case) to expected format (camelCase)
      const mappedLeads = dbLeads.map(lead => ({
        id: lead.id,
        firstName: lead.firstName || lead.first_name || lead.name?.split(' ')[0] || '',
        lastName: lead.lastName || lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        jobTitle: lead.jobTitle || lead.job_title || lead.title || '',
        company: lead.company || lead.company_name || '',
        industry: lead.industry,
        location: lead.location,
        linkedinUrl: lead.linkedinUrl || lead.linkedin_url,
        companyWebsite: lead.companyWebsite || lead.website,
        companySize: lead.companySize || lead.company_size || '',
        leadScore: lead.leadScore || lead.score || 0,
        source: lead.source || 'manual',
        verificationStatus: lead.verificationStatus || lead.status || 'pending',
        lastUpdated: lead.lastUpdated || lead.updated_at || lead.created_at
      }))
      
      setLeads(mappedLeads)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    let filtered = leads

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        (lead.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(lead => {
        switch (selectedFilter) {
          case 'verified':
            return lead.verificationStatus === 'verified'
          case 'pending':
            return lead.verificationStatus === 'pending'
          case 'high-score':
            return lead.leadScore >= 80
          default:
            return true
        }
      })
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, selectedFilter])



  const handleGenerateLeads = async () => {
    if (!generationParams.industry || generationParams.jobTitles.length === 0) {
      toast.error('Please fill in industry and job titles')
      return
    }

    try {
      setLoading(true)
      toast.info('Generating leads... This may take a few minutes.')
      
      const newLeads = await realLeadGeneration.generateLeads(generationParams)
      
      // Save leads to database
      const user = await blink.auth.me()
      for (const lead of newLeads) {
        await blink.db.leads.create({
          id: lead.id,
          first_name: lead.firstName,
          last_name: lead.lastName,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          job_title: lead.jobTitle,
          title: lead.jobTitle,
          company: lead.company,
          company_name: lead.company,
          industry: lead.industry,
          location: lead.location,
          linkedin_url: lead.linkedinUrl,
          website: lead.companyWebsite,
          company_size: lead.companySize,
          score: lead.leadScore,
          source: lead.source,
          status: lead.verificationStatus,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      await loadLeads()
      setShowGenerateDialog(false)
      toast.success(`Generated ${newLeads.length} new leads!`)
    } catch (error) {
      console.error('Error generating leads:', error)
      toast.error('Failed to generate leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const csvText = await file.text()
      const importedLeads = await realLeadGeneration.importLeadsFromCSV(csvText)
      
      // Save leads to database
      const user = await blink.auth.me()
      for (const lead of importedLeads) {
        await blink.db.leads.create({
          id: lead.id,
          first_name: lead.firstName,
          last_name: lead.lastName,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          job_title: lead.jobTitle,
          title: lead.jobTitle,
          company: lead.company,
          company_name: lead.company,
          industry: lead.industry,
          location: lead.location,
          linkedin_url: lead.linkedinUrl,
          website: lead.companyWebsite,
          company_size: lead.companySize,
          score: lead.leadScore,
          source: lead.source,
          status: lead.verificationStatus,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      await loadLeads()
      setShowImportDialog(false)
      toast.success(`Imported ${importedLeads.length} leads from CSV!`)
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('Failed to import CSV. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const stats = {
    total: leads.length,
    verified: leads.filter(l => l.verificationStatus === 'verified').length,
    highScore: leads.filter(l => l.leadScore >= 80).length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length) : 0
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-600">Manage and generate high-quality prospects</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Leads from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload a CSV file with columns: firstName, lastName, email, company, jobTitle, industry, location
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={loading}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary gap-2">
                <Zap className="h-4 w-4" />
                Generate Leads
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Lead Generation</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., SaaS, E-commerce, Healthcare"
                      value={generationParams.industry}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA"
                      value={generationParams.location}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="jobTitles">Job Titles *</Label>
                  <Textarea
                    id="jobTitles"
                    placeholder="Enter job titles separated by commas (e.g., CEO, CTO, VP Sales, Marketing Director)"
                    value={generationParams.jobTitles.join(', ')}
                    onChange={(e) => setGenerationParams(prev => ({ 
                      ...prev, 
                      jobTitles: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={generationParams.companySize}
                      onValueChange={(value) => setGenerationParams(prev => ({ ...prev, companySize: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startup">Startup (1-10)</SelectItem>
                        <SelectItem value="small">Small (11-50)</SelectItem>
                        <SelectItem value="medium">Medium (51-200)</SelectItem>
                        <SelectItem value="large">Large (201-1000)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="limit">Number of Leads</Label>
                    <Select
                      value={generationParams.limit?.toString()}
                      onValueChange={(value) => setGenerationParams(prev => ({ ...prev, limit: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 leads</SelectItem>
                        <SelectItem value="50">50 leads</SelectItem>
                        <SelectItem value="100">100 leads</SelectItem>
                        <SelectItem value="200">200 leads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateLeads} 
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  {loading ? 'Generating...' : 'Generate Leads'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Leads</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">High Score</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.highScore.toLocaleString()}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="metric-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
                <SelectItem value="high-score">High Score (80+)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="metric-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads ({filteredLeads.length})</span>
            {loading && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No leads found</h3>
              <p className="text-slate-600 mb-4">
                {leads.length === 0 
                  ? "Get started by generating your first leads with AI"
                  : "Try adjusting your search or filters"
                }
              </p>
              {leads.length === 0 && (
                <Button onClick={() => setShowGenerateDialog(true)} className="btn-primary">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Leads
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">Contact</th>
                    <th className="text-left p-4 font-medium text-slate-700">Company</th>
                    <th className="text-left p-4 font-medium text-slate-700">Score</th>
                    <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    <th className="text-left p-4 font-medium text-slate-700">Source</th>
                    <th className="text-left p-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="table-row">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {(lead.firstName || '').charAt(0)}{(lead.lastName || '').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {(lead.firstName || '')} {(lead.lastName || '')}
                            </div>
                            <div className="text-sm text-slate-600">{lead.email}</div>
                            <div className="text-sm text-slate-500">{lead.jobTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-slate-900">{lead.company}</div>
                            <div className="text-sm text-slate-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold ${getScoreColor(lead.leadScore)}`}>
                            {lead.leadScore}
                          </div>
                          <Progress value={lead.leadScore} className="w-16 h-2" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getVerificationIcon(lead.verificationStatus)}
                          <Badge 
                            className={`status-badge ${
                              lead.verificationStatus === 'verified' ? 'status-active' :
                              lead.verificationStatus === 'pending' ? 'status-pending' : 'status-inactive'
                            }`}
                          >
                            {lead.verificationStatus}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Mail className="h-4 w-4" />
                          </Button>
                          {lead.linkedinUrl && (
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}