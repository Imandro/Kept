'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PiggyBank, Plus, ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface SavingTransaction {
  id: string
  amount: number
  description: string
  date: string
  goal?: { id: string; name: string } | null
  savingMethod?: { id: string; name: string } | null
}

export default function SavingsPage() {
  const { data: session } = useSession()
  const [savings, setSavings] = useState<SavingTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/transactions?type=SAVING&limit=50')
        if (res.ok) {
          const data = await res.json()
          setSavings(data.transactions || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSaved = savings.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ahorro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tus aportaciones y metas</p>
        </div>
      </div>

      <Card className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total ahorrado</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
              <PiggyBank className="h-7 w-7" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Movimientos de ahorro</h2>
        <Link href="/dashboard/transactions">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : savings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Aún no tienes ahorros registrados</p>
            <Link href="/dashboard/transactions">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Registrar ahorro
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savings.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.description || 'Ahorro'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(s.date)}{s.goal ? ` · ${s.goal.name}` : ''}{s.savingMethod ? ` · ${s.savingMethod.name}` : ''}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-600 dark:text-gray-300">+{formatCurrency(s.amount)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
