import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { MobileLayout } from '@/components/mobile-layout'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return <MobileLayout>{children}</MobileLayout>
}
