import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick, defineComponent, h, reactive } from 'vue'
import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import ProjectListView from '../../../views/projects/ProjectListView.vue'

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

let projectsQueryState: ReturnType<typeof createProjectsQueryState>
let languagesQueryState: ReturnType<typeof createLanguagesQueryState>
let tagListQueryState: ReturnType<typeof createTagListQueryState>

vi.mock('../../../queries/projects', () => ({
  useProjectsQuery: () => projectsQueryState,
  useProjectLanguagesQuery: () => languagesQueryState,
}))

vi.mock('../../../queries/tags', () => ({
  useTagListQuery: () => tagListQueryState,
}))

vi.mock('../../../utils/feedback', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
  useNotification: () => ({}),
  useDialog: () => ({}),
  useLoadingBar: () => ({}),
}))

vi.mock('../../../components/projects/ProjectCard.vue', () => ({
  default: defineComponent({
    name: 'ProjectCardStub',
    props: {
      project: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'project-card' }, props.project.fullName)
    },
  }),
}))

vi.mock('../../../components/common/TagSelector.vue', () => ({
  default: defineComponent({
    name: 'TagSelectorStub',
    props: {
      modelValue: {
        type: Array,
        default: () => [],
      },
    },
    emits: ['update:modelValue', 'search', 'change'],
    setup(props, { emit }) {
      return () =>
        h(
          'div',
          {
            'data-testid': 'tag-selector',
            onClick: () => emit('update:modelValue', props.modelValue),
          },
          'tag-selector'
        )
    },
  }),
}))

vi.mock('naive-ui', () => {
  const buttonStub = defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { slots, emit, attrs }) {
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

  const selectStub = defineComponent({
    name: 'NSelect',
    emits: ['update:value'],
    setup(_, { attrs, slots }) {
      return () =>
        h(
          'div',
          {
            ...attrs,
            'data-testid': attrs['data-testid'] ?? 'n-select',
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
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-testid': 'project-spin',
            'data-loading': props.show ? 'true' : 'false',
          },
          slots.default?.()
        )
    },
  })

  const paginationStub = defineComponent({
    name: 'NPagination',
    emits: ['update:page', 'update:page-size'],
    setup(_, { attrs, slots, emit }) {
      return () =>
        h('div', { ...attrs, 'data-testid': 'pagination' }, [
          ...(slots.default?.() ?? []),
          h(
            'button',
            {
              'data-testid': 'pagination-set-page-2',
              type: 'button',
              onClick: () => emit('update:page', 2),
            },
            'page-2'
          ),
          h(
            'button',
            {
              'data-testid': 'pagination-set-size-50',
              type: 'button',
              onClick: () => emit('update:page-size', 50),
            },
            'size-50'
          ),
        ])
    },
  })

  const spaceStub = defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', {}, slots.default?.())
    },
  })

  const switchStub = defineComponent({
    name: 'NSwitch',
    props: {
      value: {
        type: Boolean,
        default: undefined,
      },
      modelValue: {
        type: Boolean,
        default: undefined,
      },
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

  const inputNumberStub = defineComponent({
    name: 'NInputNumber',
    emits: ['update:value'],
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'input-number' }, slots.default?.())
    },
  })

  const datePickerStub = defineComponent({
    name: 'NDatePicker',
    emits: ['update:value'],
    setup() {
      return () => h('div', { 'data-testid': 'date-picker' })
    },
  })

  return {
    NButton: buttonStub,
    NInput: inputStub,
    NSelect: selectStub,
    NSpace: spaceStub,
    NSwitch: switchStub,
    NSpin: spinStub,
    NPagination: paginationStub,
    NInputNumber: inputNumberStub,
    NDatePicker: datePickerStub,
  }
})

function createProjectsQueryState() {
  return {
    data: ref(),
    isFetching: ref(false),
    error: ref<unknown>(null),
    refetch: vi.fn(),
  }
}

function createLanguagesQueryState() {
  return {
    data: ref<string[]>([]),
    isLoading: ref(false),
  }
}

function createTagListQueryState() {
  return {
    data: ref<{ data: Array<unknown>; total: number } | undefined>({ data: [], total: 0 }),
    isFetching: ref(false),
    isFetched: ref(false),
    error: ref<unknown>(null),
  }
}

function createProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'project-1',
    fullName: 'demo/project',
    ...overrides,
  }
}

function renderProjectListView() {
  return render(ProjectListView)
}

describe('ProjectListView', () => {
  beforeEach(() => {
    route.query = {}
    push.mockReset()
    replace.mockReset()

    projectsQueryState = createProjectsQueryState()
    languagesQueryState = createLanguagesQueryState()
    tagListQueryState = createTagListQueryState()
  })

  it('显示加载状态', async () => {
    projectsQueryState.isFetching.value = true

    const { getByTestId } = renderProjectListView()
    await nextTick()

    expect(getByTestId('project-spin').dataset.loading).toBe('true')
  })

  it('显示空状态', async () => {
    projectsQueryState.data.value = { data: [], total: 0 }
    projectsQueryState.isFetching.value = false

    const { getByTestId, queryByTestId } = renderProjectListView()
    await nextTick()

    expect(getByTestId('project-empty')).toBeInTheDocument()
    expect(queryByTestId('project-card')).toBeNull()
  })

  it('显示错误状态', async () => {
    projectsQueryState.error.value = new Error('加载失败')
    projectsQueryState.data.value = undefined

    const { getByTestId, queryByTestId } = renderProjectListView()
    await nextTick()

    expect(getByTestId('project-error')).toBeInTheDocument()
    expect(queryByTestId('project-empty')).toBeNull()
  })

  it('更新关键字时同步路由查询参数', async () => {
    projectsQueryState.data.value = { data: [createProject({ id: 'p1' })], total: 1 }

    const { getByPlaceholderText } = renderProjectListView()
    const user = userEvent.setup()
    replace.mockClear()

    const input = getByPlaceholderText('输入名称、描述或关键字')
    await user.type(input, 'vue')
    await nextTick()

    const lastCall = replace.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ query: { keyword: 'vue' } })
  })

  it('切换收藏筛选时同步路由查询参数', async () => {
    projectsQueryState.data.value = { data: [createProject({ id: 'p1' })], total: 1 }

    const { getAllByRole } = renderProjectListView()
    const user = userEvent.setup()
    replace.mockClear()

    const switches = getAllByRole('switch')
    await user.click(switches[0]!)
    await nextTick()

    const lastCall = replace.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ query: { favorite: 'true' } })
  })

  it('分页交互更新路由查询参数', async () => {
    projectsQueryState.data.value = { data: [createProject({ id: 'p1' })], total: 100 }

    const { getByTestId } = renderProjectListView()
    const user = userEvent.setup()
    replace.mockClear()

    await user.click(getByTestId('pagination-set-page-2'))
    await nextTick()

    const lastCall = replace.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ query: { page: '2' } })
  })

  it('调整每页数量时会重置页码并同步查询', async () => {
    route.query = { page: '3' }
    projectsQueryState.data.value = { data: [createProject({ id: 'p1' })], total: 100 }

    const { getByTestId } = renderProjectListView()
    const user = userEvent.setup()
    replace.mockClear()

    await user.click(getByTestId('pagination-set-size-50'))
    await nextTick()

    const lastCall = replace.mock.calls.at(-1)?.[0]
    expect(lastCall).toEqual({ query: { pageSize: '50' } })
  })
})
