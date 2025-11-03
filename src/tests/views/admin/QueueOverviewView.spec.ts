import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { render, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import type { QueueCounts, QueuesStatus } from '../../../types/admin'
import { getQueuesStatus } from '../../../api/admin'

vi.stubEnv('DEV', true)
vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/')

type QueryOptions = {
  queryKey: unknown[]
  queryFn: () => unknown
  refetchInterval?: number
}

let queryOptions: QueryOptions | undefined
let queuesQueryState: ReturnType<typeof createQueuesQueryState>

const naiveUiMocks = vi.hoisted(() => {
  const message = {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }
  return {
    message,
    discrete: {
      message,
      notification: {},
      dialog: {},
      loadingBar: {},
    },
  }
})

const messageMock = naiveUiMocks.message

vi.mock('@tanstack/vue-query', () => ({
  useQuery: (options: QueryOptions) => {
    queryOptions = options
    return queuesQueryState
  },
}))

vi.mock('naive-ui', () => {
  const buttonStub = defineComponent({
    name: 'NButton',
    props: {
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['click'],
    setup(props, { slots, attrs, emit }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            type: 'button',
            disabled: props.disabled,
            onClick: (event: MouseEvent) => {
              if (props.disabled) return
              emit('click', event)
            },
          },
          slots.default?.()
        )
    },
  })

  const spinStub = defineComponent({
    name: 'NSpin',
    props: {
      show: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { slots, attrs }) {
      return () =>
        h(
          'div',
          {
            ...attrs,
            'data-testid': 'queue-spin',
            'data-loading': props.show ? 'true' : 'false',
          },
          slots.default?.()
        )
    },
  })

  const alertStub = defineComponent({
    name: 'NAlert',
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'queue-error' }, slots.default?.())
    },
  })

  const cardStub = defineComponent({
    name: 'NCard',
    props: {
      title: String,
    },
    setup(props, { slots, attrs }) {
      return () =>
        h(
          'section',
          {
            ...attrs,
            'data-testid':
              props.title === '并发配置'
                ? 'queue-config-card'
                : (attrs['data-testid'] ?? 'queue-card'),
            'data-title': props.title ?? '',
          },
          [
            ...(slots['header-extra']?.() ?? []),
            h('header', { 'data-testid': 'queue-card-title' }, props.title ?? ''),
            ...(slots.default?.() ?? []),
          ]
        )
    },
  })

  const gridStub = defineComponent({
    name: 'NGrid',
    setup(_, { slots, attrs }) {
      return () =>
        h(
          'div',
          { ...attrs, 'data-testid': attrs['data-testid'] ?? 'queue-grid' },
          slots.default?.()
        )
    },
  })

  const gridItemStub = defineComponent({
    name: 'NGridItem',
    setup(_, { slots, attrs }) {
      return () =>
        h(
          'div',
          { ...attrs, 'data-testid': attrs['data-testid'] ?? 'queue-grid-item' },
          slots.default?.()
        )
    },
  })

  const dividerStub = defineComponent({
    name: 'NDivider',
    setup() {
      return () => h('hr', { 'data-testid': 'queue-divider' })
    },
  })

  const spaceStub = defineComponent({
    name: 'NSpace',
    setup(_, { slots, attrs }) {
      return () => h('div', attrs, slots.default?.())
    },
  })

  const tagStub = defineComponent({
    name: 'NTag',
    setup(_, { slots, attrs }) {
      return () => h('span', attrs, slots.default?.())
    },
  })

  const descriptionsStub = defineComponent({
    name: 'NDescriptions',
    setup(_, { slots, attrs }) {
      return () => h('dl', attrs, slots.default?.())
    },
  })

  const descriptionsItemStub = defineComponent({
    name: 'NDescriptionsItem',
    setup(_, { slots, attrs }) {
      return () => h('div', attrs, slots.default?.())
    },
  })

  const discreteApi = naiveUiMocks.discrete

  return {
    NButton: buttonStub,
    NSpin: spinStub,
    NAlert: alertStub,
    NCard: cardStub,
    NGrid: gridStub,
    NGridItem: gridItemStub,
    NDivider: dividerStub,
    NSpace: spaceStub,
    NTag: tagStub,
    NDescriptions: descriptionsStub,
    NDescriptionsItem: descriptionsItemStub,
    useMessage: () => messageMock,
    useNotification: () => discreteApi.notification,
    useDialog: () => discreteApi.dialog,
    useLoadingBar: () => discreteApi.loadingBar,
    createDiscreteApi: () => discreteApi,
  }
})

let QueueOverviewView: typeof import('../../../views/admin/QueueOverviewView.vue').default

beforeAll(async () => {
  QueueOverviewView = (await import('../../../views/admin/QueueOverviewView.vue')).default
})

beforeEach(() => {
  queuesQueryState = createQueuesQueryState()
  queryOptions = undefined
  messageMock.warning.mockReset()
  messageMock.error.mockReset()
  messageMock.success.mockReset()
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(() => {
  openSpy?.mockRestore()
})

afterAll(() => {
  vi.unstubAllEnvs()
})

type WindowOpenFn = typeof window.open

let openSpy: MockInstance<WindowOpenFn> | undefined

function createQueuesQueryState() {
  return {
    data: ref<QueuesStatus | undefined>(undefined),
    isLoading: ref(false),
    isFetching: ref(false),
    isStale: ref(false),
    isError: ref(false),
    error: ref<unknown>(null),
    refetch: vi.fn(),
    dataUpdatedAt: ref<number | undefined>(undefined),
  }
}

function createQueueCounts(overrides: Partial<QueueCounts> = {}): QueueCounts {
  return {
    waiting: 0,
    active: 0,
    delayed: 0,
    completed: 0,
    failed: 0,
    paused: 0,
    waitingChildren: 0,
    prioritized: 0,
    stalled: 0,
    total: 0,
    totalProcessed: 0,
    successRate: undefined,
    isPaused: false,
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderQueueOverview() {
  return render(QueueOverviewView)
}

describe('QueueOverviewView', () => {
  it('使用正确的 useQuery 配置', () => {
    renderQueueOverview()

    expect(queryOptions?.queryKey).toEqual(['admin', 'queues'])
    expect(queryOptions?.refetchInterval).toBe(30_000)
    expect(queryOptions?.queryFn).toBe(getQueuesStatus)
  })

  it('显示加载状态', async () => {
    queuesQueryState.isLoading.value = true

    const { getByTestId } = renderQueueOverview()
    await nextTick()

    expect(getByTestId('queue-spin').dataset.loading).toBe('true')
  })

  it('显示错误提示', async () => {
    queuesQueryState.isError.value = true

    const { getByText } = renderQueueOverview()
    await nextTick()

    expect(getByText('无法获取队列状态，请稍后重试。')).toBeInTheDocument()
  })

  it('显示空状态', async () => {
    const { getByText } = renderQueueOverview()
    await nextTick()

    expect(getByText('No Data')).toBeInTheDocument()
  })

  it('展示队列数据与统计', async () => {
    queuesQueryState.data.value = {
      message: 'ok',
      queues: {
        syncStars: createQueueCounts({
          waiting: 2,
          active: 1,
          delayed: 3,
          completed: 40,
          failed: 5,
          stalled: 2,
          waitingChildren: 4,
          prioritized: 6,
          paused: 1,
          total: 63,
          totalProcessed: 45,
          successRate: 0.889,
          isPaused: true,
          updatedAt: '2025-10-13T11:03:22.000Z',
        }),
        aiSummary: createQueueCounts({
          waiting: 0,
          active: 0,
          delayed: 1,
          completed: 71,
          failed: 0,
          stalled: 0,
          waitingChildren: 0,
          prioritized: 0,
          paused: 0,
          total: 72,
          totalProcessed: 71,
          successRate: 0.972,
          updatedAt: '2025-10-13T11:03:22.000Z',
        }),
        maintenance: createQueueCounts({
          waiting: 0,
          active: 0,
          delayed: 0,
          completed: 24,
          failed: 6,
          stalled: 0,
          waitingChildren: 0,
          prioritized: 0,
          paused: 0,
          total: 30,
          totalProcessed: 30,
          successRate: 0.8,
          updatedAt: '2025-10-13T11:03:22.000Z',
        }),
      },
      config: {
        aiSummaryConcurrency: 2,
        aiRpmLimit: undefined,
        syncConcurrency: 3,
      },
    }
    queuesQueryState.dataUpdatedAt.value = new Date('2025-10-13T11:03:22.000Z').getTime()

    const { getAllByTestId, getByText } = renderQueueOverview()
    await nextTick()

    const cards = getAllByTestId('queue-card')
    expect(cards).toHaveLength(3)

    const syncCard = cards[0]
    expect(within(syncCard).getByText('同步队列')).toBeInTheDocument()
    expect(within(syncCard).getByText('暂停中')).toBeInTheDocument()
    expect(within(syncCard).getByText('警告：存在失败任务')).toBeInTheDocument()

    const waitingLabel = within(syncCard).getByText('等待')
    expect(waitingLabel.nextElementSibling?.textContent).toBe('2')
    const successLabel = within(syncCard).getByText('成功率')
    expect(successLabel.nextElementSibling?.textContent).toBe('88.9%')

    const maintenanceCard = cards[2]
    const failedLabel = within(maintenanceCard).getByText('失败')
    expect(failedLabel.nextElementSibling?.textContent).toBe('6')

    const refreshLabel = getByText(/^上次刷新/)
    expect(refreshLabel.textContent).not.toContain('尚未刷新')

    expect(getByText('AI 并发').nextElementSibling?.textContent).toBe('2')
    expect(getByText('AI RPM 限制').nextElementSibling?.textContent).toBe('未限制')
    expect(getByText('同步并发').nextElementSibling?.textContent).toBe('3')
  })

  it('点击手动刷新调用 refetch', async () => {
    const user = userEvent.setup()
    queuesQueryState.data.value = {
      message: 'ok',
      queues: {
        syncStars: createQueueCounts(),
        aiSummary: createQueueCounts(),
        maintenance: createQueueCounts(),
      },
      config: {
        aiSummaryConcurrency: 1,
        aiRpmLimit: undefined,
        syncConcurrency: 1,
      },
    }

    const { getByText } = renderQueueOverview()
    await nextTick()

    await user.click(getByText('手动刷新'))
    expect(queuesQueryState.refetch).toHaveBeenCalledTimes(1)
  })

  it('点击 Bull Board 按钮打开新窗口', async () => {
    const user = userEvent.setup()
    queuesQueryState.data.value = {
      message: 'ok',
      queues: {
        syncStars: createQueueCounts(),
        aiSummary: createQueueCounts(),
        maintenance: createQueueCounts(),
      },
      config: {
        aiSummaryConcurrency: 1,
        aiRpmLimit: undefined,
        syncConcurrency: 1,
      },
    }

    const { getAllByText } = renderQueueOverview()
    await nextTick()

    const bullBoardButtons = getAllByText('打开 Bull Board')
    await user.click(bullBoardButtons[0]!)

    expect(openSpy).toHaveBeenCalledTimes(1)
    const targetUrl = openSpy.mock.calls[0]?.[0] as string
    expect(targetUrl).toContain('/admin/queues/ui/queue/sync-stars')
    expect(messageMock.warning).not.toHaveBeenCalled()
  })
})
