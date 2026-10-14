import Dexie from 'dexie';

export interface OfflineTransaction {
  id?: number;
  localId: string;           // UUID generado localmente
  serverId?: string;         // ID del servidor (cuando se sincroniza)
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'SAVING' | 'TRANSFER';
  description: string;
  notes?: string;
  date: string;              // ISO string
  accountId: string;
  categoryId?: string;
  goalId?: string;
  savingMethodId?: string;
  tags: string[];
  location?: string;
  createdAt: string;         // ISO string
  updatedAt: string;
  synced: boolean;           // true si ya está en servidor
  pending: boolean;          // true si hay cambios pendientes
  deleted: boolean;          // soft delete
}

export interface OfflineAccount {
  id?: number;
  localId: string;
  serverId?: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  synced: boolean;
  pending: boolean;
  deleted: boolean;
}

export interface OfflineGoal {
  id?: number;
  localId: string;
  serverId?: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: string;
  targetDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  icon?: string;
  color?: string;
  synced: boolean;
  pending: boolean;
  deleted: boolean;
}

export interface OfflineCategory {
  id?: number;
  localId: string;
  serverId?: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | 'SAVING';
  parentId?: string;
  isSystem: boolean;
  sortOrder: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  entity: 'transaction' | 'account' | 'goal' | 'category';
  action: 'create' | 'update' | 'delete';
  localId: string;
  serverId?: string;
  data: any;
  timestamp: string;
  retries: number;
  lastError?: string;
}

export class KeptDB extends Dexie {
  transactions!: Dexie.Table<OfflineTransaction, number>;
  accounts!: Dexie.Table<OfflineAccount, number>;
  goals!: Dexie.Table<OfflineGoal, number>;
  categories!: Dexie.Table<OfflineCategory, number>;
  syncQueue!: Dexie.Table<SyncQueueItem, number>;

  constructor() {
    super('KeptDB');
    this.version(1).stores({
      transactions: '++id, localId, serverId, date, accountId, categoryId, synced, pending, deleted',
      accounts: '++id, localId, serverId, synced, pending, deleted',
      goals: '++id, localId, serverId, synced, pending, deleted',
      categories: '++id, localId, serverId, synced',
      syncQueue: '++id, entity, action, localId, timestamp, retries',
    });

    // Hooks para auto-agregar a sync queue
    this.transactions.hook('creating', (primKey, obj, trans) => {
      if (!obj.synced) {
        trans.table('syncQueue').add({
          entity: 'transaction',
          action: 'create',
          localId: obj.localId,
          data: obj,
          timestamp: new Date().toISOString(),
          retries: 0,
        });
      }
    });

    this.transactions.hook('updating', (modifications, primKey, obj, trans) => {
      if (obj && !obj.synced) {
        trans.table('syncQueue').add({
          entity: 'transaction',
          action: 'update',
          localId: obj.localId,
          serverId: obj.serverId,
          data: { ...obj, ...modifications },
          timestamp: new Date().toISOString(),
          retries: 0,
        });
      }
    });

    this.transactions.hook('deleting', (primKey, obj, trans) => {
      if (obj) {
        trans.table('syncQueue').add({
          entity: 'transaction',
          action: 'delete',
          localId: obj.localId,
          serverId: obj.serverId,
          data: obj,
          timestamp: new Date().toISOString(),
          retries: 0,
        });
      }
    });
  }
}

export const db = new KeptDB();

// Helper functions
export async function generateLocalId(): Promise<string> {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export async function getPendingSyncCount(): Promise<number> {
  return await db.syncQueue.count();
}

export async function clearSyncedQueue(): Promise<void> {
  await db.syncQueue.where('retries').above(0).delete();
}