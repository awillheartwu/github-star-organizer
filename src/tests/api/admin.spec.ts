import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AiBatchItem } from '../../types/admin'
import { listAiBatches, getAiBatch } from '../../api/admin'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('../../api/http', () => ({
  api: {
    get: getMock,
  },
}))

const sampleItem: AiBatchItem = {
  id: 'h1',
  source: 'ai:summary',
  key: 'batch:abc',
  lastRunAt: '2026-01-30T04:00:00.000Z',
  lastSuccessAt: '2026-01-30T04:00:10.000Z',
  lastErrorAt: null,
  lastError: null,
  statsJson: '{"ok":1}',
  createdAt: '2026-01-30T04:00:10.000Z',
}

describe('admin api service', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('lists ai batches with query params', async () => {
    getMock.mockResolvedValue({
      data: {
        message: 'ok',
        data: [sampleItem],
        page: 2,
        pageSize: 10,
        total: 1,
      },
    })

    await listAiBatches({
      page: 2,
      pageSize: 10,
      sortField: 'createdAt',
      sortOrder: 'asc',
    })

    expect(getMock).toHaveBeenCalledWith('/admin/ai/batches', {
      params: {
        page: 2,
        pageSize: 10,
        sortField: 'createdAt',
        sortOrder: 'asc',
      },
    })
  })

  it('gets ai batch detail by id', async () => {
    getMock.mockResolvedValue({
      data: {
        message: 'ok',
        data: sampleItem,
      },
    })

    const result = await getAiBatch('h1')

    expect(getMock).toHaveBeenCalledWith('/admin/ai/batches/h1')
    expect(result).toEqual(sampleItem)
  })
})
