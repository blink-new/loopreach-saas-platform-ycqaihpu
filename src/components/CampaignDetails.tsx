import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Mail, Linkedin, Clock } from 'lucide-react'
import { type Campaign } from '@/services/campaignService'

export function CampaignDetails({ campaign }: { campaign: Campaign }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs">Type</Label>
                <p className="text-sm">{campaign.type}</p>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
              </div>
              <div>
                <Label className="text-xs">Follow-up Delay</Label>
                <p className="text-sm">{campaign.followUpDelay} days</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs">Sent</span>
                <span className="text-sm font-medium">{campaign.sentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Opened</span>
                <span className="text-sm font-medium">{campaign.openedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Replied</span>
                <span className="text-sm font-medium">{campaign.repliedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Meetings</span>
                <span className="text-sm font-medium">{campaign.meetingsBooked}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="messages" className="space-y-4">
        {campaign.emailTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <p className="text-sm">{campaign.emailSubject}</p>
                </div>
                <div>
                  <Label className="text-xs">Message</Label>
                  <p className="text-sm whitespace-pre-wrap">{campaign.emailTemplate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {campaign.linkedinMessage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{campaign.linkedinMessage}</p>
            </CardContent>
          </Card>
        )}
        
        {campaign.followUpTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Follow-up Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{campaign.followUpTemplate}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sent</span>
                  <span>{campaign.sentCount}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Opened</span>
                  <span>{campaign.openedCount} ({campaign.sentCount > 0 ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1) : 0}%)</span>
                </div>
                <Progress value={campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Replied</span>
                  <span>{campaign.repliedCount} ({campaign.sentCount > 0 ? ((campaign.repliedCount / campaign.sentCount) * 100).toFixed(1) : 0}%)</span>
                </div>
                <Progress value={campaign.sentCount > 0 ? (campaign.repliedCount / campaign.sentCount) * 100 : 0} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Meetings Booked</span>
                  <span>{campaign.meetingsBooked} ({campaign.sentCount > 0 ? ((campaign.meetingsBooked / campaign.sentCount) * 100).toFixed(1) : 0}%)</span>
                </div>
                <Progress value={campaign.sentCount > 0 ? (campaign.meetingsBooked / campaign.sentCount) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}