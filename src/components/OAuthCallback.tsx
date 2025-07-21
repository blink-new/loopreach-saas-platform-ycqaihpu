import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { integrationService } from '@/services/integrationService'
import { calendarService } from '@/services/calendarService'

export default function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [provider, setProvider] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const error = urlParams.get('error')

        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state')
        }

        // Get provider from session storage
        const storedProvider = sessionStorage.getItem('oauth_provider')
        if (!storedProvider) {
          throw new Error('OAuth session expired')
        }

        setProvider(storedProvider)

        // Handle different provider callbacks
        if (storedProvider === 'gmail' || storedProvider === 'outlook') {
          await integrationService.handleOAuthCallback(code, storedProvider)
          setMessage(`${storedProvider === 'gmail' ? 'Gmail' : 'Outlook'} connected successfully!`)
        } else if (storedProvider === 'linkedin') {
          await integrationService.handleOAuthCallback(code, storedProvider)
          setMessage('LinkedIn connected successfully!')
        } else if (state === 'google_calendar' || state === 'microsoft_calendar') {
          await calendarService.handleOAuthCallback(code, state)
          setMessage('Calendar connected successfully!')
        } else {
          throw new Error('Unknown OAuth provider')
        }

        setStatus('success')
        
        // Clean up session storage
        sessionStorage.removeItem('oauth_provider')

        // Redirect to settings after 3 seconds
        setTimeout(() => {
          navigate('/settings')
        }, 3000)

      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to complete OAuth flow')
      }
    }

    handleCallback()
  }, [navigate])

  const handleRetry = () => {
    navigate('/settings')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Connecting...'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && `Connecting your ${provider} account...`}
            {status === 'success' && 'Redirecting you back to settings...'}
            {status === 'error' && 'There was an issue connecting your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                You will be redirected automatically in a few seconds.
              </p>
              <Button onClick={() => navigate('/settings')} variant="outline" size="sm">
                Go to Settings Now
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                Back to Settings
              </Button>
              <p className="text-xs text-gray-500">
                You can try connecting again from the Settings page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}