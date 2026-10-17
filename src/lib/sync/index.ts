import { db, SyncQueueItem } from '@/lib/db';

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30000; // 30 segundos

let syncInProgress = false;
let syncInterval: NodeJS.Timeout | null = null;

export async function startSyncEngine(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Registrar Background Sync si está disponible
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await (registration as any).sync.register('kept-sync');
      console.log('Background Sync registered');
    } catch (err) {
      console.log('Background Sync registration failed:', err);
    }
  }

  // Polling fallback
  syncInterval = setInterval(() => {
    if (navigator.onLine) processSyncQueue();
  }, SYNC_INTERVAL);

  // Escuchar online/offline
  window.addEventListener('online', () => processSyncQueue());
  window.addEventListener('offline', () => console.log('Offline mode'));
}

export async function stopSyncEngine(): Promise<void> {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export let processSyncQueue: () => Promise<void> = async (): Promise<void> => {
  if (syncInProgress || !navigator.onLine) return;
  
  syncInProgress = true;
  console.log('Processing sync queue...');

  try {
    const pendingItems = await db.syncQueue
      .where('retries')
      .below(MAX_RETRIES)
      .sortBy('timestamp');

    for (const item of pendingItems) {
      if (!navigator.onLine) break;
      
      try {
        await processSyncItem(item);
        await db.syncQueue.delete(item.id!);
        console.log(`Synced: ${item.entity} ${item.action} ${item.localId}`);
      } catch (err: any) {
        console.error(`Sync failed for ${item.id}:`, err);
        await db.syncQueue.update(item.id!, {
          retries: item.retries + 1,
          lastError: err.message,
        });
      }
    }
  } finally {
    syncInProgress = false;
  }
}

async function processSyncItem(item: SyncQueueItem): Promise<void> {
  const endpoint = `/api/sync/${item.entity}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: item.action,
      localId: item.localId,
      serverId: item.serverId,
      data: item.data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sync failed');
  }

  const result = await response.json();
  
  // Actualizar localId con serverId si es creación
  if (item.action === 'create' && result.serverId) {
    await updateLocalIdToServerId(item.entity, item.localId, result.serverId);
  }
}

async function updateLocalIdToServerId(entity: string, localId: string, serverId: string): Promise<void> {
  const table = db[entity as keyof typeof db] as any;
  if (table) {
    await table.where('localId').equals(localId).modify({ serverId, synced: true, pending: false });
  }
}

// Funciones públicas para componentes
export async function queueCreate<T extends { localId: string }>(
  entity: 'transaction' | 'account' | 'goal' | 'category',
  data: T
): Promise<void> {
  await (db[entity + 's' as keyof typeof db] as any).add(data as any);
}

export async function queueUpdate<T extends { localId: string; serverId?: string }>(
  entity: 'transaction' | 'account' | 'goal' | 'category',
  data: T
): Promise<void> {
  await (db[entity + 's' as keyof typeof db] as any).update(data.localId, data as any);
}

export async function queueDelete(
  entity: 'transaction' | 'account' | 'goal' | 'category',
  localId: string,
  serverId?: string
): Promise<void> {
  // Soft delete
  await (db[entity + 's' as keyof typeof db] as any).update(localId, { deleted: true, pending: true });
  await db.syncQueue.add({
    entity,
    action: 'delete',
    localId,
    serverId,
    data: { localId, serverId, deleted: true },
    timestamp: new Date().toISOString(),
    retries: 0,
  });
}

// Hook para React Query invalidation
export function subscribeToSync(callback: () => void): () => void {
  const originalProcess = processSyncQueue;
  processSyncQueue = async () => {
    await originalProcess();
    callback();
  };
  return () => { processSyncQueue = originalProcess; };
}