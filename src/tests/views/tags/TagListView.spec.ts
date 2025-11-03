import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, defineComponent, h, reactive, nextTick } from 'vue'
import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import TagListView from '../../../views/tags/TagListView.vue'

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

let tagListState: ReturnType<typeof createTagListState>
let mutationMocks: ReturnType<typeof createMutationMocks>

vi.mock('../../../queries/tags', () => ({
  useTagListQuery: () => tagListState,
  useTagMutations: () => mutationMocks,
}))

vi.mock('../../../utils/feedback', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
  useDialog: () => ({
    warning: vi.fn(),
  }),
}))

vi.mock('naive-ui', () => {
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
    },
    setup(props, { attrs }) {
      return () =>
        h('table', {
          ...attrs,
          'data-testid': 'tag-table',
          'data-loading': props.loading ? 'true' : 'false',
          'data-row-count': String(props.data.length),
        })
    },
  })

  const formStub = defineComponent({
    name: 'NForm',
    setup(_, { attrs, slots }) {
      return () => h('form', attrs, slots.default?.())
    },
  })

  const formItemStub = defineComponent({
    name: 'NFormItem',
    setup(_, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.())
    },
  })

  const inputStub = defineComponent({
    name: 'NInput',
    props: {
      value: String,
      modelValue: String,
    },
    emits: ['update:value', 'update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          value: props.modelValue ?? props.value ?? '',
          onInput: (event: Event) => {
            const target = event.target as HTMLInputElement
            emit('update:value', target.value)
            emit('update:modelValue', target.value)
          },
        })
    },
  })

  const modalStub = defineComponent({
    name: 'NModal',
    props: {
      show: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['update:show'],
    setup(_, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.())
    },
  })

  const spaceStub = defineComponent({
    name: 'NSpace',
    setup(_, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.())
    },
  })

  const switchStub = defineComponent({
    name: 'NSwitch',
    props: {
      value: Boolean,
      modelValue: Boolean,
    },
    emits: ['update:value', 'update:modelValue'],
    setup(props, { attrs, slots, emit }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            type: 'button',
            role: 'switch',
            'aria-checked': String(props.modelValue ?? props.value ?? false),
            'data-testid': attrs['data-testid'] ?? 'n-switch',
            onClick: () => {
              const current = props.modelValue ?? props.value ?? false
              const next = !current
              emit('update:value', next)
              emit('update:modelValue', next)
            },
          },
          slots.default?.()
        )
    },
  })

  const tagStub = defineComponent({
    name: 'NTag',
    setup(_, { attrs, slots }) {
      return () => h('span', attrs, slots.default?.())
    },
  })

  const paginationStub = defineComponent({
    name: 'NPagination',
    emits: ['update:page', 'update:page-size'],
    setup(_, { attrs, slots, emit }) {
      return () => {
        const children = [...(slots.default?.() ?? [])]
        children.push(
          h(
            'button',
            {
              'data-testid': 'tag-pagination-set-page-2',
              type: 'button',
              onClick: () => emit('update:page', 2),
            },
            'page-2'
          ),
          h(
            'button',
            {
              'data-testid': 'tag-pagination-set-size-50',
              type: 'button',
              onClick: () => emit('update:page-size', 50),
            },
            'size-50'
          )
        )
        return h(
          'div',
          { ...attrs, 'data-testid': attrs['data-testid'] ?? 'tag-pagination' },
          children
        )
      }
    },
  })

  return {
    NButton: buttonStub,
    NDataTable: dataTableStub,
    NForm: formStub,
    NFormItem: formItemStub,
    NInput: inputStub,
    NModal: modalStub,
    NSpace: spaceStub,
    NSwitch: switchStub,
    NTag: tagStub,
    NPagination: paginationStub,
  }
})

function createTagListState() {
  return {
    data: ref<{ data: Array<unknown>; total: number } | undefined>({ data: [], total: 0 }),
    isFetching: ref(false),
    isFetched: ref(false),
    error: ref<unknown>(null),
  }
}

function createMutationMocks() {
  return {
    createMutation: {
      mutateAsync: vi.fn(),
      isPending: ref(false),
    },
    updateMutation: {
      mutateAsync: vi.fn(),
      isPending: ref(false),
    },
    deleteMutation: {
      mutate: vi.fn(),
      isPending: ref(false),
    },
  }
}

function renderTagListView() {
  return render(TagListView)
}

describe('TagListView', () => {
  beforeEach(() => {
    route.query = {}
    push.mockReset()
    replace.mockReset()

    tagListState = createTagListState()
    mutationMocks = createMutationMocks()
  })

  it('显示加载状态', async () => {
    tagListState.isFetching.value = true

    const { getByTestId } = renderTagListView()
    await nextTick()

    expect(getByTestId('tag-table').dataset.loading).toBe('true')
  })

  it('显示空状态', async () => {
    tagListState.isFetching.value = false
    tagListState.isFetched.value = true
    tagListState.data.value = { data: [], total: 0 }

    const { getByTestId } = renderTagListView()
    await nextTick()

    expect(getByTestId('tag-empty')).toBeInTheDocument()
  })

  it('显示错误状态', async () => {
    tagListState.error.value = new Error('加载失败')
    tagListState.isFetching.value = false
    tagListState.data.value = undefined

    const { getByTestId, queryByTestId } = renderTagListView()
    await nextTick()

    expect(getByTestId('tag-error')).toBeInTheDocument()
    expect(queryByTestId('tag-empty')).toBeNull()
  })

  it('更新搜索关键字时同步路由查询参数', async () => {
    tagListState.isFetched.value = true
    tagListState.data.value = { data: [{ id: '1' }], total: 1 } as unknown as {
      data: Array<unknown>
      total: number
    }

    const { getByPlaceholderText } = renderTagListView()
    const user = userEvent.setup()
    replace.mockClear()

    const input = getByPlaceholderText('搜索标签')
    await user.type(input, 'infra')
    await nextTick()

    const lastCall = replace.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ query: { keyword: 'infra' } })
  })

  it('切换归档筛选时同步路由查询参数', async () => {
    tagListState.isFetched.value = true
    tagListState.data.value = { data: [{ id: '1' }], total: 1 } as unknown as {
      data: Array<unknown>
      total: number
    }

    const { getAllByRole } = renderTagListView()
    const user = userEvent.setup()
    replace.mockClear()

    const switches = getAllByRole('switch')
    await user.click(switches[0]!)
    await nextTick()

    const lastCall = replace.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ query: { archived: 'true' } })
  })

  it('分页与每页数量交互同步路由参数', async () => {
    tagListState.isFetched.value = true
    tagListState.data.value = {
      data: Array.from({ length: 30 }, (_, index) => ({ id: String(index) })),
      total: 30,
    } as unknown as { data: Array<unknown>; total: number }

    const { getByTestId } = renderTagListView()
    const user = userEvent.setup()

    replace.mockClear()

    await user.click(getByTestId('tag-pagination-set-page-2'))
    await nextTick()
    expect(replace.mock.calls.at(-1)?.[0]).toEqual({ query: { page: '2' } })

    await user.click(getByTestId('tag-pagination-set-size-50'))
    await nextTick()
    expect(replace.mock.calls.at(-1)?.[0]).toEqual({ query: { pageSize: '50' } })
  })
})
