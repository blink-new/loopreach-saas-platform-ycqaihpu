import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  BarChart3, 
  Calendar, 
  Settings, 
  CreditCard,
  Target,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export function AppSidebar({ className }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      badge: null
    },
    {
      title: 'Leads',
      icon: Users,
      path: '/leads',
      badge: '1.2k'
    },
    {
      title: 'Outreach',
      icon: Mail,
      path: '/outreach',
      badge: 'AI'
    },
    {
      title: 'Campaigns',
      icon: Target,
      path: '/campaigns',
      badge: '5'
    },
    {
      title: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      badge: null
    },
    {
      title: 'Reports',
      icon: BarChart3,
      path: '/reports',
      badge: null
    }
  ]

  const bottomItems = [
    {
      title: 'Billing',
      icon: CreditCard,
      path: '/billing',
      badge: 'Pro'
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings',
      badge: null
    }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-50 border-r border-slate-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img 
              src="/loopreach-logo.svg" 
              alt="Loopreach.io" 
              className="h-8 w-8"
            />
            <span className="text-lg font-bold text-slate-900">Loopreach.io</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-slate-200"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Trial Banner */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-200">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-slate-900">Free Trial</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              5 days left • 347 leads remaining
            </p>
            <Button size="sm" className="w-full btn-primary text-xs">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.path)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              isCollapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-2 py-0.5",
                      item.badge === 'AI' && "bg-gradient-to-r from-primary to-accent text-white",
                      item.badge === 'Pro' && "bg-accent text-white"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Performance Summary */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-200">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-slate-900">This Week</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Emails Sent</span>
                <span className="font-medium text-slate-900">1,247</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Open Rate</span>
                <span className="font-medium text-accent">68.5%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Meetings</span>
                <span className="font-medium text-primary">12</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-slate-200 space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.path)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              isCollapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-2 py-0.5",
                      item.badge === 'Pro' && "bg-accent text-white"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}