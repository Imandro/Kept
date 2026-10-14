'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  CreditCard, 
  Target, 
  PiggyBank, 
  MessageSquare,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Users,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: Home, label: 'Inicio' },
  { name: 'Transacciones', href: '/dashboard/transactions', icon: CreditCard, label: 'Transacciones' },
  { name: 'Metas', href: '/dashboard/goals', icon: Target, label: 'Metas' },
  { name: 'Ahorro', href: '/dashboard/savings', icon: PiggyBank, label: 'Ahorro' },
  { name: 'Spark', href: '/dashboard/ai-spark', icon: Sparkles, label: 'Spark' },
]

export function MobileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') console.log('PWA installed')
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe max-w-sm mx-auto relative">
      {/* Status bar spacer */}
      <div className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800" />
      
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-8 left-4 right-4 z-50 bg-amber-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-slide-down flex items-center justify-between">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Sin conexión - Los cambios se sincronizarán al reconectar</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="pb-20 min-h-[calc(100vh-8px)]">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 pb-safe z-40" role="navigation" aria-label="Navegación principal">
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-200'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <item.icon className={cn('h-6 w-6', isActive && 'fill-current')} aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
          {/* Spark Tab */}
          <Link
            href="/dashboard/ai-spark"
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all',
              pathname === '/dashboard/ai-spark' || pathname.startsWith('/dashboard/ai-spark/')
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-200'
            )}
            aria-current={pathname === '/dashboard/ai-spark' ? 'page' : undefined}
            aria-label="Spark"
          >
            <Sparkles className="h-6 w-6" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">Spark</span>
          </Link>
        </div>
      </nav>

      {/* Settings Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-10 right-4 z-30 h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg" aria-label="Menú">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 max-w-[85vw] p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Menú</h2>
            <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-1 mb-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1 mb-4">
            <Link href="/settings/profile" onClick={() => setSheetOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Users className="h-5 w-5" /> Perfil
            </Link>
            <Link href="/settings/accounts" onClick={() => setSheetOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Wallet className="h-5 w-5" /> Cuentas
            </Link>
            <Link href="/settings/notifications" onClick={() => setSheetOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="h-5 w-5" /> Notificaciones
            </Link>
            <Link href="/settings" onClick={() => setSheetOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="h-5 w-5" /> Configuración
            </Link>
          </div>

          <Separator className="my-4" />

          {deferredPrompt && (
            <Button className="w-full mb-2" onClick={handleInstall}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Instalar Kept
            </Button>
          )}

          <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}