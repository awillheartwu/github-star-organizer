import { render, fireEvent } from '@testing-library/vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { ProjectSummary } from '../../types/project'
import ProjectCard from '../../components/projects/ProjectCard.vue'

const mutateAsync = vi.fn<(variables: unknown) => Promise<void>>()
const isPending = ref(false)
const pushMock = vi.fn()
const authStore = {
  user: { role: 'ADMIN' },
}

vi.mock('../../queries/projects', () => ({
  useProjectUpdateMutation: () => ({
    mutateAsync,
    isPending,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => authStore,
}))

vi.mock('naive-ui', () => {
  const simpleStub = (name: string) =>
    defineComponent({
      name,
      setup(_, context) {
        return () => h('div', {}, context.slots.default?.())
      },
    })

  const ButtonStub = defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, context) {
      const { slots, emit } = context
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.()
        )
    },
  })

  const CardStub = defineComponent({
    name: 'NCard',
    emits: ['click'],
    setup(_, context) {
      const { slots, emit } = context
      return () =>
        h(
          'div',
          {
            'data-testid': 'card',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.()
        )
    },
  })

  return {
    NCard: CardStub,
    NButton: ButtonStub,
    NSpace: simpleStub('NSpace'),
    NTag: simpleStub('NTag'),
  }
})

const baseProject: ProjectSummary = {
  id: '1',
  githubId: 100,
  name: 'demo',
  fullName: 'demo/repo',
  url: 'https://example.com/demo',
  description: '示例项目',
  language: 'TypeScript',
  stars: 100,
  forks: 10,
  lastCommit: '2024-01-20T08:00:00.000Z',
  lastSyncAt: '2024-01-21T09:00:00.000Z',
  touchedAt: null,
  notes: null,
  favorite: false,
  archived: false,
  pinned: false,
  score: null,
  summaryShort: null,
  summaryLong: null,
  createdAt: '2023-12-01T00:00:00.000Z',
  updatedAt: '2024-01-21T09:00:00.000Z',
  deletedAt: null,
  tags: [],
  videoLinks: [],
}

function renderProjectCard(overrides: Partial<ProjectSummary> = {}) {
  const project = { ...baseProject, ...overrides }
  const renderResult = render(ProjectCard, {
    props: { project },
  })
  return { project, ...renderResult }
}

describe('ProjectCard', () => {
  beforeEach(() => {
    mutateAsync.mockReset()
    mutateAsync.mockResolvedValue(undefined)
    pushMock.mockReset()
    isPending.value = false
    authStore.user = { role: 'ADMIN' }
  })

  it('shows pin control when admin user is present', () => {
    const { getByRole } = renderProjectCard()

    expect(getByRole('button', { name: '设为收藏' })).toBeInTheDocument()
    expect(getByRole('button', { name: '设为置顶' })).toBeInTheDocument()
  })

  it('hides pin control for non-admin users', () => {
    authStore.user = { role: 'USER' }

    const { queryByRole } = renderProjectCard()

    expect(queryByRole('button', { name: '设为置顶' })).toBeNull()
  })

  it('requests favorite toggle through mutation', async () => {
    const { getByRole, project } = renderProjectCard({ favorite: false })

    await fireEvent.click(getByRole('button', { name: '设为收藏' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      id: project.id,
      payload: { favorite: true },
      successMessage: '已收藏项目',
    })
  })

  it('navigates to project detail when detail button clicked', async () => {
    const { getByRole, project } = renderProjectCard({ id: '42' })

    await fireEvent.click(getByRole('button', { name: '详情' }))

    expect(pushMock).toHaveBeenCalledWith({ name: 'project-detail', params: { id: project.id } })
  })

  it('navigates to project detail when card body clicked', async () => {
    const { getByTestId, project } = renderProjectCard({ id: '51' })

    await fireEvent.click(getByTestId('card'))

    expect(pushMock).toHaveBeenCalledWith({ name: 'project-detail', params: { id: project.id } })
  })
})
