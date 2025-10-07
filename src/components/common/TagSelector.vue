<script setup lang="ts">
import { computed } from 'vue'
import { NSelect, type SelectOption } from 'naive-ui'

export interface TagOption {
  label: string
  value: string
}

const props = defineProps<{
  modelValue: string[]
  options: TagOption[]
  loading?: boolean
  placeholder?: string
  remote?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
  search: [value: string]
}>()

const selectOptions = computed<SelectOption[]>(() =>
  props.options.map((option) => ({ label: option.label, value: option.value }))
)

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: string[]) => {
    emit('update:modelValue', value)
    emit('change', value)
  },
})

function handleSearch(value: string) {
  emit('search', value)
}
</script>

<template>
  <n-select
    v-model:value="internalValue"
    :options="selectOptions"
    :loading="props.loading"
    multiple
    filterable
    :remote="props.remote === true"
    clearable
    tag
    max-tag-count="responsive"
    :placeholder="props.placeholder ?? '选择标签'"
    @search="handleSearch"
  />
</template>
