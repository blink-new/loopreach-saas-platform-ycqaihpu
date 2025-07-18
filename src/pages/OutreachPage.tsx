import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { 
  Zap, 
  Mail, 
  MessageSquare, 
  Copy, 
  RefreshCw, 
  Send,
  Sparkles,
  Target,
  User,
  Building
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

export default function OutreachPage() {
  const [user, setUser] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState({
    subject: '',
    email: '',
    linkedin: '',
    followUp: ''
  })
  
  const [formData, setFormData] = useState({
    productDescription: '',
    targetAudience: '',
    industry: 'saas',
    tone: 'professional',
    personalization: {
      firstName: 'John',
      lastName: 'Smith',
      company: 'TechCorp',
      title: 'VP of Marketing'
    }
  })

  const { toast } = useToast()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadUser()
  }, [])

  const handleGenerateContent = async () => {
    if (!formData.productDescription.trim() || !formData.targetAudience.trim()) {
      toast({
        title: "Error",
        description: "Please fill in product description and target audience",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    
    try {
      // Generate cold email
      const emailPrompt = `
        Create a personalized cold email for B2B outreach with the following details:
        
        Product/Service: ${formData.productDescription}
        Target Audience: ${formData.targetAudience}
        Industry: ${formData.industry}
        Tone: ${formData.tone}
        
        Personalization:
        - First Name: ${formData.personalization.firstName}
        - Company: ${formData.personalization.company}
        - Title: ${formData.personalization.title}
        
        Requirements:
        - Subject line should be compelling and personalized
        - Email should be 150-200 words
        - Include a clear value proposition
        - End with a soft call-to-action
        - Use personalization tokens like {{firstName}}, {{company}}, {{title}}
        - Sound natural and conversational
        
        Format the response as:
        SUBJECT: [subject line]
        
        EMAIL:
        [email body]
      `

      const emailResponse = await blink.ai.generateText({
        prompt: emailPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 500
      })

      // Parse the response
      const emailContent = emailResponse.text
      const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i)
      const emailMatch = emailContent.match(/EMAIL:\s*([\s\S]+)/i)

      const subject = subjectMatch ? subjectMatch[1].trim() : 'Personalized outreach for {{company}}'
      const email = emailMatch ? emailMatch[1].trim() : emailContent

      // Generate LinkedIn message
      const linkedinPrompt = `
        Create a short LinkedIn connection message (under 300 characters) for:
        
        Product/Service: ${formData.productDescription}
        Target: ${formData.personalization.firstName} ${formData.personalization.lastName} at ${formData.personalization.company}
        Their Title: ${formData.personalization.title}
        
        Make it personal, professional, and mention a specific reason for connecting.
        Use personalization tokens like {{firstName}}, {{company}}, {{title}}.
      `

      const linkedinResponse = await blink.ai.generateText({
        prompt: linkedinPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 150
      })

      // Generate follow-up email
      const followUpPrompt = `
        Create a follow-up email for someone who didn't respond to the initial outreach:
        
        Original context: ${formData.productDescription} for ${formData.targetAudience}
        
        Requirements:
        - Shorter than the original email (100-150 words)
        - Reference the previous email briefly
        - Provide additional value or insight
        - Different angle/benefit than the first email
        - Professional but slightly more direct
        - Use personalization tokens
        
        Format as:
        SUBJECT: [subject line]
        
        EMAIL:
        [email body]
      `

      const followUpResponse = await blink.ai.generateText({
        prompt: followUpPrompt,
        model: 'gpt-4o-mini',
        maxTokens: 400
      })

      const followUpContent = followUpResponse.text
      const followUpSubjectMatch = followUpContent.match(/SUBJECT:\s*(.+)/i)
      const followUpEmailMatch = followUpContent.match(/EMAIL:\s*([\s\S]+)/i)

      const followUpSubject = followUpSubjectMatch ? followUpSubjectMatch[1].trim() : 'Following up on {{company}}'
      const followUpEmail = followUpEmailMatch ? followUpEmailMatch[1].trim() : followUpContent

      setGeneratedContent({
        subject,
        email,
        linkedin: linkedinResponse.text,
        followUp: `${followUpSubject}\n\n${followUpEmail}`
      })

      // Save template to database
      if (user) {
        await blink.db.emailTemplates.create({
          id: `template_${Date.now()}`,
          userId: user.id,
          name: `${formData.industry} - ${formData.targetAudience}`,
          subject,
          content: email,
          templateType: 'cold_email',
          industry: formData.industry,
          tone: formData.tone
        })
      }

      toast({
        title: "Success",
        description: "AI-generated outreach content is ready!"
      })

    } catch (error) {
      console.error('Error generating content:', error)
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`
    })
  }

  const replaceTokens = (text: string) => {
    return text
      .replace(/\{\{firstName\}\}/g, formData.personalization.firstName)
      .replace(/\{\{lastName\}\}/g, formData.personalization.lastName)
      .replace(/\{\{company\}\}/g, formData.personalization.company)
      .replace(/\{\{title\}\}/g, formData.personalization.title)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Outreach</h1>
          <p className="text-gray-600 mt-1">Generate personalized emails and messages with AI</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Campaign Setup
            </CardTitle>
            <CardDescription>
              Provide details about your product and target audience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product">Product/Service Description</Label>
              <Textarea
                id="product"
                placeholder="Describe your product or service, key benefits, and unique value proposition..."
                value={formData.productDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Textarea
                id="audience"
                placeholder="Describe your ideal customer profile, their pain points, and what they care about..."
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="consultative">Consultative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Personalization Preview</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.personalization.firstName}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      personalization: { ...prev.personalization, firstName: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.personalization.lastName}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      personalization: { ...prev.personalization, lastName: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.personalization.company}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      personalization: { ...prev.personalization, company: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.personalization.title}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      personalization: { ...prev.personalization, title: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateContent} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate AI Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Generated Content
            </CardTitle>
            <CardDescription>
              AI-generated outreach messages ready to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedContent.email ? (
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content generated yet</h3>
                <p className="text-gray-600">Fill in the form and click "Generate AI Content" to get started</p>
              </div>
            ) : (
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    LinkedIn
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="flex items-center">
                    <Send className="h-4 w-4 mr-1" />
                    Follow-up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">Subject Line</Label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.subject, 'Subject line')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm font-medium">{replaceTokens(generatedContent.subject)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium">Email Body</Label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.email, 'Email')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-md border">
                        <div className="whitespace-pre-wrap text-sm">
                          {replaceTokens(generatedContent.email)}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="linkedin" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">LinkedIn Connection Message</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.linkedin, 'LinkedIn message')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                      <div className="whitespace-pre-wrap text-sm">
                        {replaceTokens(generatedContent.linkedin)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Character count: {replaceTokens(generatedContent.linkedin).length}/300
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="followup" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Follow-up Email</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.followUp, 'Follow-up email')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <div className="whitespace-pre-wrap text-sm">
                        {replaceTokens(generatedContent.followUp)}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personalization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Available Tokens</h4>
              <div className="space-y-1 text-sm">
                <p><code className="bg-gray-100 px-1 rounded">{'{{firstName}}'}</code> - Prospect's first name</p>
                <p><code className="bg-gray-100 px-1 rounded">{'{{lastName}}'}</code> - Prospect's last name</p>
                <p><code className="bg-gray-100 px-1 rounded">{'{{company}}'}</code> - Company name</p>
                <p><code className="bg-gray-100 px-1 rounded">{'{{title}}'}</code> - Job title</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Keep emails under 200 words</li>
                <li>• Focus on their pain points, not your features</li>
                <li>• Include a clear, single call-to-action</li>
                <li>• Test different subject lines</li>
                <li>• Follow up within 3-5 business days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}