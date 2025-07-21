import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type CampaignMessage } from '@/services/campaignService'

export function CampaignForm({ 
  onSubmit, 
  isCreating, 
  aiMessages 
}: { 
  onSubmit: (data: any) => void
  isCreating: boolean
  aiMessages: CampaignMessage[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    emailSubject: '',
    emailTemplate: '',
    linkedinMessage: '',
    followUpDelay: 3,
    followUpTemplate: '',
    calendlyLink: ''
  })

  // Auto-fill from AI messages
  useEffect(() => {
    if (aiMessages.length > 0) {
      const emailMessage = aiMessages.find(m => m.type === 'email' && !m.isFollowUp)
      const linkedinMessage = aiMessages.find(m => m.type === 'linkedin' && !m.isFollowUp)
      const followUpMessage = aiMessages.find(m => m.isFollowUp)

      if (emailMessage) {
        setFormData(prev => ({
          ...prev,
          emailSubject: emailMessage.subject || '',
          emailTemplate: emailMessage.content
        }))
      }

      if (linkedinMessage) {
        setFormData(prev => ({
          ...prev,
          linkedinMessage: linkedinMessage.content
        }))
      }

      if (followUpMessage) {
        setFormData(prev => ({
          ...prev,
          followUpTemplate: followUpMessage.content
        }))
      }
    }
  }, [aiMessages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Campaign Type</Label>
          <Select value={formData.type} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email Only</SelectItem>
              <SelectItem value="linkedin">LinkedIn Only</SelectItem>
              <SelectItem value="mixed">Email + LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this campaign"
        />
      </div>

      {(formData.type === 'email' || formData.type === 'mixed') && (
        <>
          <div>
            <Label htmlFor="emailSubject">Email Subject</Label>
            <Input
              id="emailSubject"
              value={formData.emailSubject}
              onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
              placeholder="Quick question about {{companyName}}"
            />
          </div>
          <div>
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Textarea
              id="emailTemplate"
              value={formData.emailTemplate}
              onChange={(e) => setFormData(prev => ({ ...prev, emailTemplate: e.target.value }))}
              placeholder="Hi {{firstName}}, I noticed {{companyName}} is..."
              rows={4}
            />
          </div>
        </>
      )}

      {(formData.type === 'linkedin' || formData.type === 'mixed') && (
        <div>
          <Label htmlFor="linkedinMessage">LinkedIn Message</Label>
          <Textarea
            id="linkedinMessage"
            value={formData.linkedinMessage}
            onChange={(e) => setFormData(prev => ({ ...prev, linkedinMessage: e.target.value }))}
            placeholder="Hi {{firstName}}, I'd love to connect..."
            rows={3}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="followUpDelay">Follow-up Delay (days)</Label>
          <Select value={formData.followUpDelay.toString()} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, followUpDelay: parseInt(value) }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="calendlyLink">Calendly Link</Label>
          <Input
            id="calendlyLink"
            value={formData.calendlyLink}
            onChange={(e) => setFormData(prev => ({ ...prev, calendlyLink: e.target.value }))}
            placeholder="https://calendly.com/your-link"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="followUpTemplate">Follow-up Template</Label>
        <Textarea
          id="followUpTemplate"
          value={formData.followUpTemplate}
          onChange={(e) => setFormData(prev => ({ ...prev, followUpTemplate: e.target.value }))}
          placeholder="Hi {{firstName}}, following up on my previous message..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isCreating} className="w-full">
        {isCreating ? 'Creating Campaign...' : 'Create Campaign'}
      </Button>
    </form>
  )
}