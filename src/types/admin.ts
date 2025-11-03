export interface QueueCounts {
  waiting: number
  active: number
  delayed: number
  completed: number
  failed: number
  paused: number
  waitingChildren: number
  prioritized: number
  stalled: number
  total: number
  totalProcessed: number
  successRate?: number
  isPaused: boolean
  updatedAt: string
}

export interface QueuesStatus {
  message: string
  queues: {
    syncStars: QueueCounts
    aiSummary: QueueCounts
    maintenance: QueueCounts
  }
  config: {
    aiSummaryConcurrency?: number
    aiRpmLimit?: number
    syncConcurrency?: number
  }
}

export interface SyncState {
  id: string
  source: string
  key: string
  cursor?: string | null
  etag?: string | null
  lastRunAt?: string | null
  lastSuccessAt?: string | null
  lastErrorAt?: string | null
  lastError?: string | null
  statsJson?: string | SyncStatsSummary | null
  latestStats?: SyncStatsSummary | null
  updatedAt: string
}

export interface SyncStatsSummary {
  scanned: number
  created: number
  updated: number
  unchanged: number
  softDeleted: number
  pages: number
  rateLimitRemaining?: number
  errors?: number
  startedAt?: string
  finishedAt?: string
  durationMs?: number
}

export interface ArchivedProjectSnapshot {
  id: string
  githubId?: number
  reason: 'manual' | 'unstarred'
  archivedAt: string
  snapshot: unknown
}

export interface AiBatchItem {
  key: string
  lastRunAt?: string | null
  lastSuccessAt?: string | null
  statsJson?: string | null
  updatedAt: string
}
