import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useThemeStore } from '../../stores/theme'

const storageKey = 'github-star-organizer:theme'

const createMatchMediaMock = (matches: boolean) =>
  vi.fn().mockReturnValue({
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })

const originalMatchMedia = window.matchMedia

beforeEach(() => {
  setActivePinia(createPinia())
  window.localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
  window.matchMedia = createMatchMediaMock(false)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('theme store', () => {
  it('uses stored theme over system preference', async () => {
    window.localStorage.setItem(storageKey, 'dark')
    window.matchMedia = createMatchMediaMock(false)

    const store = useThemeStore()
    await nextTick()

    expect(store.mode).toBe('dark')
    expect(store.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem(storageKey)).toBe('dark')
  })

  it('falls back to prefers-color-scheme when no stored value', async () => {
    window.matchMedia = createMatchMediaMock(true)

    const store = useThemeStore()
    await nextTick()

    expect(store.mode).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('persists changes when toggling theme', async () => {
    const store = useThemeStore()
    await nextTick()

    expect(store.mode).toBe('light')
    store.toggleMode()
    await nextTick()

    expect(store.mode).toBe('dark')
    expect(window.localStorage.getItem(storageKey)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    store.toggleMode()
    await nextTick()

    expect(store.mode).toBe('light')
    expect(window.localStorage.getItem(storageKey)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
