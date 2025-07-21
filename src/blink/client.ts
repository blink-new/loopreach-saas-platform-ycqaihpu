import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'loopreach-saas-platform-ycqaihpu',
  authRequired: true,
  analytics: {
    enabled: false
  }
})