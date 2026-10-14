import { auth } from '@/lib/auth'
import { SparkEngine } from '@/lib/ai/spark-engine'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, history } = await request.json()
    const engine = new SparkEngine(session.user.id)
    
    // Procesar mensaje único (para UI simple)
    const result = await engine.processMessage(message)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Spark chat error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}