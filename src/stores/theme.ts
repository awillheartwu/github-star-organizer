import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

type ThemeMode = 'light' | 'dark'

const storageKey = 'github-star-organizer:theme'

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch (error) {
    console.warn('Unable to read theme preference', error)
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

const applyThemeClass = (mode: ThemeMode) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = mode
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(resolveInitialTheme())
  const isDark = computed(() => mode.value === 'dark')

  const setMode = (value: ThemeMode) => {
    mode.value = value
  }

  const toggleMode = () => {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  watch(
    mode,
    (value) => {
      applyThemeClass(value)
      if (typeof window === 'undefined') {
        return
      }
      try {
        window.localStorage.setItem(storageKey, value)
      } catch (error) {
        console.warn('Unable to persist theme preference', error)
      }
    },
    { immediate: true }
  )

  return {
    mode,
    isDark,
    setMode,
    toggleMode,
  }
})
