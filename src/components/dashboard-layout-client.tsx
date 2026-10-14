'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  CreditCard, 
  Calendar, 
  Target, 
  PiggyBank, 
  BarChart3, 
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Wallet,
  Users,
  Bell,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

interface SessionUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Session {
  user?: SessionUser
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transacciones', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Metas', href: '/dashboard/goals', icon: Target },
  { name: 'Ahorro', href: '/dashboard/savings', icon: PiggyBank },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Asistente IA', href: '/dashboard/ai-chat', icon: MessageSquare },
]

const settingsNav = [
  { name: 'Perfil', href: '/settings/profile', icon: Users },
  { name: 'Cuentas', href: '/settings/accounts', icon: Wallet },
  { name: 'Categorías', href: '/settings/categories', icon: CreditCard },
  { name: 'Notificaciones', href: '/settings/notifications', icon: Bell },
  { name: 'Preferencias IA', href: '/settings/ai', icon: MessageSquare },
]

interface DashboardLayoutClientProps {
  session: Session | null
  children: ReactNode
}

export function DashboardLayoutClient({ session, children }: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % 3]
    setTheme(nextTheme)
    document.documentElement.classList.remove('light', 'dark')
    if (nextTheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }
    } else {
      document.documentElement.classList.add(nextTheme)
    }
    localStorage.setItem('theme', nextTheme)
  }

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="h-4 w-4" />
    if (theme === 'light') return <Sun className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar móvil */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col">
          {/* Header del sidebar */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Kept</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navegación principal */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navegación principal">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-foreground')} aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <Separator className="mx-3 my-4" />

          {/* Configuración */}
          <nav className="px-3 space-y-1" aria-label="Configuración">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-foreground')} aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer con usuario */}
          <div className="mt-auto p-3 border-t border-gray-200 dark:border-gray-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                    <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session?.user?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/accounts" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Cuentas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-600 focus:text-red-600 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenido principal */}
      <div className="lg:pl-64 min-h-screen">
        {/* Header superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 lg:px-8">
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
              {getThemeIcon()}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                    <AvatarFallback className="text-xs">{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/accounts" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Cuentas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-600 focus:text-red-600 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}