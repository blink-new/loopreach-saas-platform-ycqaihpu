import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Linkedin } from 'lucide-react'
import { type CampaignMessage } from '@/services/campaignService'

export function AIMessageGenerator({ 
  onGenerate, 
  messages 
}: { 
  onGenerate: (data: any) => void
  messages: CampaignMessage[]
}) {
  const [formData, setFormData] = useState({
    companyInfo: '',
    targetAudience: '',
    campaignGoal: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await onGenerate(formData)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="companyInfo">Your Company Info</Label>
          <Textarea
            id="companyInfo"
            placeholder="We're a B2B SaaS company that helps businesses automate their sales processes..."
            value={formData.companyInfo}
            onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: e.target.value }))}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Textarea
            id="targetAudience"
            placeholder="CEOs and VPs of Sales at mid-market companies (100-1000 employees) in the technology sector..."
            value={formData.targetAudience}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="campaignGoal">Campaign Goal</Label>
          <Textarea
            id="campaignGoal"
            placeholder="Book 15-minute discovery calls to understand their current sales challenges and demonstrate our solution..."
            value={formData.campaignGoal}
            onChange={(e) => setFormData(prev => ({ ...prev, campaignGoal: e.target.value }))}
            rows={2}
          />
        </div>
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating || !formData.companyInfo || !formData.targetAudience}
        className="w-full"
      >
        {isGenerating ? 'Generating Messages...' : 'Generate AI Messages'}
      </Button>

      {messages.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Generated Messages</h3>
          {messages.map((message, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {message.type === 'email' ? <Mail className="h-4 w-4" /> : <Linkedin className="h-4 w-4" />}
                  {message.type === 'email' ? 'Email' : 'LinkedIn'} 
                  {message.isFollowUp && ' (Follow-up)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {message.subject && (
                  <div className="mb-2">
                    <Label className="text-xs">Subject:</Label>
                    <p className="text-sm font-medium">{message.subject}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Message:</Label>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}