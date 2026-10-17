'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CreditCard, Target, PiggyBank, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/transactions', label: 'Movimientos', icon: CreditCard },
  { href: '/dashboard/goals', label: 'Metas', icon: Target },
  { href: '/dashboard/savings', label: 'Ahorro', icon: PiggyBank },
  { href: '/dashboard/ai-spark', label: 'Spark', icon: Sparkles },
]

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-4 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            K
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Kept</span>
        </Link>
        <Link href="/settings/profile" aria-label="Perfil">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
            <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-2 text-[10px]"
              >
                <motion.span
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </motion.span>
                <span className={cn(isActive ? 'font-medium text-primary' : 'text-gray-500 dark:text-gray-400')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
