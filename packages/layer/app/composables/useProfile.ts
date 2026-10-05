/**
 * 本地档案（ADR-0008）：只存在浏览器 IndexedDB，服务端不存储任何用户数据。
 * 支持带 schema 版本号的 JSON 导入 / 导出；一期只用于攻略的过滤与排序。
 */
import { computed, ref } from 'vue'

const DB_NAME = 'paibook'
const STORE = 'profiles'
const SCHEMA_VERSION = 1

export interface ProfileFile {
  schema: number
  gameId: string
  entityIds: string[]
  updatedAt: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'gameId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useProfile() {
  const config = useRuntimeConfig()
  const gameId = computed(() => String((config.public as { siteGame?: string }).siteGame ?? ''))

  const entityIds = ref<string[]>([])
  const ready = ref(false)
  const enabled = ref(false)

  async function load(): Promise<void> {
    if (!import.meta.client || !gameId.value) {
      ready.value = true
      return
    }
    try {
      const stored = await transact<ProfileFile | undefined>('readonly', (store) => store.get(gameId.value))
      entityIds.value = stored?.entityIds ?? []
    } catch (error) {
      console.warn('[profile] 读取失败：', String(error))
      entityIds.value = []
    }
    enabled.value = entityIds.value.length > 0
    ready.value = true
  }

  async function persist(): Promise<void> {
    if (!import.meta.client || !gameId.value) return
    const file: ProfileFile = {
      schema: SCHEMA_VERSION,
      gameId: gameId.value,
      entityIds: [...entityIds.value],
      updatedAt: new Date().toISOString(),
    }
    await transact('readwrite', (store) => store.put(file))
  }

  async function toggleEntity(id: string): Promise<void> {
    entityIds.value = entityIds.value.includes(id)
      ? entityIds.value.filter((item) => item !== id)
      : [...entityIds.value, id]
    await persist()
  }

  async function clear(): Promise<void> {
    if (import.meta.client && gameId.value) {
      await transact('readwrite', (store) => store.delete(gameId.value))
    }
    entityIds.value = []
  }

  function exportJson(): string {
    const file: ProfileFile = {
      schema: SCHEMA_VERSION,
      gameId: gameId.value,
      entityIds: [...entityIds.value],
      updatedAt: new Date().toISOString(),
    }
    return JSON.stringify(file, null, 2)
  }

  async function importJson(text: string): Promise<number> {
    const parsed = JSON.parse(text) as Partial<ProfileFile>
    const incoming = Array.isArray(parsed.entityIds)
      ? parsed.entityIds.filter((item): item is string => typeof item === 'string')
      : []
    entityIds.value = incoming
    await persist()
    return incoming.length
  }

  return { gameId, entityIds, enabled, ready, load, persist, toggleEntity, clear, exportJson, importJson }
}

/** 攻略是否命中档案：与选中实体有交集即命中；档案为空时一律放行。 */
export function matchesProfile(entityIds: string[], profile: string[]): boolean {
  if (profile.length === 0) return true
  return entityIds.some((id) => profile.includes(id))
}
