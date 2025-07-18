import React, { useState, useEffect, useCallback } from 'react'
import { Upload, Download, Search, Filter, Plus, MoreHorizontal, Star, Mail, Phone, Building2, User, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@blinkdotnew/sdk'
import ICPLeadGenerator from '@/components/ICPLeadGenerator'

const blink = createClient({
  projectId: 'loopreach-saas-platform-ycqaihpu',
  authRequired: true
})

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  title: string
  phone?: string
  linkedinUrl?: string
  website?: string
  industry?: string
  score: number
  status: 'new' | 'contacted' | 'replied' | 'meeting_booked' | 'cold'
  source: string
  notes?: string
  createdAt: string
  userId: string
  generatedFromIcp?: string
  icpProfileId?: string
}

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    linkedinUrl: '',
    website: '',
    industry: '',
    notes: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const loadLeads = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const leadsData = await blink.db.leads.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setLeads(leadsData)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleFileUpload = async () => {
    if (!uploadFile) return

    try {
      setUploadProgress(10)
      const user = await blink.auth.me()
      
      // Read CSV file
      const text = await uploadFile.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      setUploadProgress(30)
      
      const newLeads: Omit<Lead, 'id' | 'createdAt'>[] = []
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const lead: any = {
            userId: user.id,
            score: Math.floor(Math.random() * 100) + 1, // AI scoring placeholder
            status: 'new',
            source: 'csv_import'
          }
          
          headers.forEach((header, index) => {
            const value = values[index] || ''
            switch (header) {
              case 'first_name':
              case 'firstname':
                lead.firstName = value
                break
              case 'last_name':
              case 'lastname':
                lead.lastName = value
                break
              case 'email':
                lead.email = value
                break
              case 'company':
                lead.company = value
                break
              case 'title':
              case 'job_title':
                lead.title = value
                break
              case 'phone':
                lead.phone = value
                break
              case 'linkedin':
              case 'linkedin_url':
                lead.linkedinUrl = value
                break
              case 'website':
                lead.website = value
                break
              case 'industry':
                lead.industry = value
                break
            }
          })
          
          if (lead.email && lead.firstName) {
            newLeads.push(lead)
          }
        }
        setUploadProgress(30 + (i / lines.length) * 50)
      }
      
      setUploadProgress(80)
      
      // Save leads to database
      await blink.db.leads.createMany(newLeads)
      
      setUploadProgress(100)
      
      toast({
        title: "Success!",
        description: `Imported ${newLeads.length} leads successfully.`
      })
      
      setIsUploadOpen(false)
      setUploadFile(null)
      setUploadProgress(0)
      loadLeads()
      
    } catch (error) {
      console.error('Error uploading leads:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to import leads. Please check your CSV format.",
        variant: "destructive"
      })
      setUploadProgress(0)
    }
  }

  const handleAddLead = async () => {
    try {
      const user = await blink.auth.me()
      const lead = {
        ...newLead,
        userId: user.id,
        score: Math.floor(Math.random() * 100) + 1,
        status: 'new' as const,
        source: 'manual'
      }
      
      await blink.db.leads.create(lead)
      
      toast({
        title: "Success!",
        description: "Lead added successfully."
      })
      
      setIsAddLeadOpen(false)
      setNewLead({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        title: '',
        phone: '',
        linkedinUrl: '',
        website: '',
        industry: '',
        notes: ''
      })
      loadLeads()
      
    } catch (error) {
      console.error('Error adding lead:', error)
      toast({
        title: "Error",
        description: "Failed to add lead. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      await blink.db.leads.delete(leadId)
      toast({
        title: "Success!",
        description: "Lead deleted successfully."
      })
      loadLeads()
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead.",
        variant: "destructive"
      })
    }
  }

  const exportLeads = () => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Company', 'Title', 'Phone', 'LinkedIn', 'Website', 'Industry', 'Score', 'Status'],
      ...filteredLeads.map(lead => [
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.company,
        lead.title,
        lead.phone || '',
        lead.linkedinUrl || '',
        lead.website || '',
        lead.industry || '',
        lead.score.toString(),
        lead.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'loopreach-leads.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'default',
      contacted: 'secondary',
      replied: 'outline',
      meeting_booked: 'default',
      cold: 'destructive'
    }
    
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-green-100 text-green-800',
      meeting_booked: 'bg-purple-100 text-purple-800',
      cold: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    const matchesScore = scoreFilter === 'all' || 
      (scoreFilter === 'high' && lead.score >= 80) ||
      (scoreFilter === 'medium' && lead.score >= 60 && lead.score < 80) ||
      (scoreFilter === 'low' && lead.score < 60)
    
    return matchesSearch && matchesStatus && matchesScore
  })

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
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage your lead database and track engagement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLeads}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Leads from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with columns: first_name, last_name, email, company, title, phone, linkedin, website, industry
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFileUpload} disabled={!uploadFile || uploadProgress > 0}>
                    Import Leads
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Manually add a new lead to your database
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({...newLead, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={newLead.company}
                    onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={newLead.title}
                    onChange={(e) => setNewLead({...newLead, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={newLead.linkedinUrl}
                    onChange={(e) => setNewLead({...newLead, linkedinUrl: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newLead.website}
                    onChange={(e) => setNewLead({...newLead, website: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newLead.industry}
                    onChange={(e) => setNewLead({...newLead, industry: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLead} disabled={!newLead.firstName || !newLead.lastName || !newLead.email || !newLead.company}>
                  Add Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="database">Lead Database</TabsTrigger>
          <TabsTrigger value="generate">AI Lead Generation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database" className="space-y-6">
          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contacted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.status === 'contacted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.score >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Meetings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.status === 'meeting_booked').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (80+)</SelectItem>
                <SelectItem value="medium">Medium (60-79)</SelectItem>
                <SelectItem value="low">Low (&lt;60)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Database</CardTitle>
          <CardDescription>
            {filteredLeads.length} of {leads.length} leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                        <div className="text-sm text-gray-500">{lead.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.company}</div>
                        {lead.industry && (
                          <div className="text-sm text-gray-500">{lead.industry}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-500">{lead.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`font-semibold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </div>
                        <div className="ml-2 w-16">
                          <Progress value={lead.score} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{lead.source}</Badge>
                        {lead.generatedFromIcp && (
                          <div className="text-xs text-gray-500">
                            ICP: {lead.generatedFromIcp}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {leads.length === 0 
                  ? "Get started by importing leads from CSV or adding them manually."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="generate">
          <ICPLeadGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LeadsPage