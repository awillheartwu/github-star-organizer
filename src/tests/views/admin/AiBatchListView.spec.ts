import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, defineComponent, h, reactive } from 'vue'
import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import AiBatchListView from '../../../views/admin/AiBatchListView.vue'

const route = reactive({ query: {} as Record<string, unknown> })
const push = vi.fn()
const replace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    push,
    replace,
  }),
}))

const queryState = {
  data: ref({
    message: 'ok',
    data: [
      {
        id: 'h1',
        source: 'ai:summary',
        key: 'batch:abc',
        lastRunAt: '2026-01-30T04:00:00.000Z',
        lastSuccessAt: '2026-01-30T04:00:10.000Z',
        lastErrorAt: null,
        lastError: null,
        statsJson: '{"ok":1}',
        createdAt: '2026-01-30T04:00:10.000Z',
      },
      {
        id: 'h2',
        source: 'maintenance',
        key: 'daily:default',
        lastRunAt: '2026-01-29T04:00:00.000Z',
        lastSuccessAt: null,
        lastErrorAt: '2026-01-29T04:00:03.000Z',
        lastError: 'boom',
        statsJson: null,
        createdAt: '2026-01-29T04:00:03.000Z',
      },
    ],
    page: 1,
    pageSize: 20,
    total: 2,
  }),
  isFetching: ref(false),
}

vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => queryState,
  keepPreviousData: {},
}))

vi.mock('naive-ui', () => {
  const createDiscreteApi = () => ({
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
    notification: {},
    dialog: {},
    loadingBar: {},
  })
  const buttonStub = defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { attrs, slots, emit }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.()
        )
    },
  })

  const tagStub = defineComponent({
    name: 'NTag',
    setup(_, { slots }) {
      return () => h('span', { 'data-testid': 'tag' }, slots.default?.())
    },
  })

  const dataTableStub = defineComponent({
    name: 'NDataTable',
    props: {
      loading: {
        type: Boolean,
        default: false,
      },
      data: {
        type: Array,
        default: () => [],
      },
      columns: {
        type: Array,
        default: () => [],
      },
    },
    setup(props, { attrs }) {
      return () =>
        h(
          'table',
          {
            ...attrs,
            'data-testid': 'batch-table',
            'data-loading': props.loading ? 'true' : 'false',
            'data-row-count': String((props.data as unknown[]).length),
          },
          (props.data as unknown[]).map((row: Record<string, unknown>) =>
            h(
              'tr',
              {},
              (props.columns as Array<Record<string, unknown>>).map((col) => {
                const render = col.render as ((r: Record<string, unknown>) => unknown) | undefined
                const key = col.key as string | undefined
                if (render) return h('td', {}, [render(row) as any])
                return h('td', {}, key ? String(row[key] ?? '') : '')
              })
            )
          )
        )
    },
  })

  const paginationStub = defineComponent({
    name: 'NPagination',
    setup() {
      return () => h('div', { 'data-testid': 'pagination' })
    },
  })

  const selectStub = defineComponent({
    name: 'NSelect',
    emits: ['update:value'],
    setup(_, { emit }) {
      return () =>
        h(
          'select',
          {
            'data-testid': 'sort-select',
            onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value),
          },
          []
        )
    },
  })

  return {
    createDiscreteApi,
    NButton: buttonStub,
    NDataTable: dataTableStub,
    NPagination: paginationStub,
    NSelect: selectStub,
    NTag: tagStub,
  }
})

describe('AiBatchListView', () => {
  beforeEach(() => {
    push.mockReset()
    replace.mockReset()
  })

  it('renders rows and status tags', () => {
    const { getByText, getAllByTestId } = render(AiBatchListView)

    expect(getByText('batch:abc')).toBeInTheDocument()
    expect(getByText('daily:default')).toBeInTheDocument()

    const tags = getAllByTestId('tag').map((node) => node.textContent)
    expect(tags).toContain('有统计数据')
    expect(tags).toContain('失败')
  })

  it('navigates to detail view when clicking view button', async () => {
    const user = userEvent.setup()
    const { getAllByRole } = render(AiBatchListView)

    const buttons = getAllByRole('button', { name: '查看' })
    await user.click(buttons[0])

    expect(push).toHaveBeenCalledWith({ name: 'admin-ai-batch-detail', params: { id: 'h1' } })
  })
})
