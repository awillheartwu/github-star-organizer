import { describe, it, expect, vi } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { render } from '@testing-library/vue'
import AiBatchDetailView from '../../../views/admin/AiBatchDetailView.vue'
import { formatDate } from '../../../utils/format'

const batchData = {
  id: 'h1',
  source: 'maintenance',
  key: 'daily:default',
  lastRunAt: '2026-01-29T04:00:00.000Z',
  lastSuccessAt: null,
  lastErrorAt: '2026-01-29T04:00:03.000Z',
  lastError: 'boom',
  statsJson: '{"ok":1}',
  createdAt: '2026-01-29T04:00:03.000Z',
}

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'h1' } }),
  useRouter: () => ({ back: vi.fn() }),
}))

const queryState = {
  data: ref(batchData),
  isFetching: ref(false),
  isError: ref(false),
}

vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => queryState,
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
    setup(_, { slots }) {
      return () => h('button', {}, slots.default?.())
    },
  })

  const cardStub = defineComponent({
    name: 'NCard',
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'card' }, slots.default?.())
    },
  })

  const codeStub = defineComponent({
    name: 'NCode',
    props: {
      code: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      return () => h('pre', { 'data-testid': 'code' }, props.code)
    },
  })

  const alertStub = defineComponent({
    name: 'NAlert',
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'alert' }, slots.default?.())
    },
  })

  return {
    createDiscreteApi,
    NButton: buttonStub,
    NCard: cardStub,
    NCode: codeStub,
    NAlert: alertStub,
  }
})

describe('AiBatchDetailView', () => {
  it('renders batch detail fields', () => {
    const { getByText, getAllByText } = render(AiBatchDetailView)

    expect(getByText('daily:default')).toBeInTheDocument()
    expect(getByText('maintenance')).toBeInTheDocument()
    expect(getAllByText(formatDate(batchData.createdAt)).length).toBeGreaterThan(0)
    expect(getAllByText(formatDate(batchData.lastErrorAt)).length).toBeGreaterThan(0)
    expect(getByText('boom')).toBeInTheDocument()
  })
})
