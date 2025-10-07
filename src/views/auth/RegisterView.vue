<script setup lang="ts">
import { AxiosError } from 'axios'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, FormRules } from 'naive-ui'
import { useAuthStore } from '../../stores/auth'
import { fetchAuthFeatures } from '../../api/auth'
import { useMessage } from '../../utils/feedback'

const auth = useAuthStore()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const formModel = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
})

const allowRegistration = ref(true)
const availabilityMessage = ref('')
const availabilityLoaded = ref(false)

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: ['input', 'blur'] },
    { type: 'email', message: '邮箱格式不正确', trigger: ['input', 'blur'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['input', 'blur'] },
    { min: 6, message: '密码长度至少 6 位', trigger: ['input', 'blur'] },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: ['input', 'blur'] },
    {
      validator: (_rule, value) => value === formModel.password,
      message: '两次输入的密码不一致',
      trigger: ['input', 'blur'],
    },
  ],
}

async function loadAvailability() {
  try {
    const features = await fetchAuthFeatures()
    allowRegistration.value = features.allowRegistration
    availabilityMessage.value = features.allowRegistration
      ? ''
      : '当前已关闭注册，请联系管理员开通。'
  } catch {
    allowRegistration.value = true
    availabilityMessage.value = ''
  } finally {
    availabilityLoaded.value = true
  }
}

onMounted(() => {
  void loadAvailability()
})

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (!allowRegistration.value) return

  try {
    await auth.register({
      email: formModel.email,
      password: formModel.password,
      displayName: formModel.displayName || undefined,
    })
    await router.replace({ name: 'login', query: { email: formModel.email } })
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>
    const status = error.response?.status
    const serverMessage = error.response?.data?.message
    if (status === 403) {
      allowRegistration.value = false
      availabilityMessage.value =
        serverMessage ?? '当前已关闭注册，请联系管理员开通。'
      message.error(availabilityMessage.value)
    } else if (status === 409) {
      message.error('该邮箱已注册，请直接登录')
    } else if (serverMessage) {
      message.error(serverMessage)
    } else {
      message.error('注册失败，请稍后重试')
    }
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-slate-900">注册</h1>
      <p class="text-sm text-slate-500">
        创建一个账户以使用 GitHub Star Organizer
      </p>
    </div>

    <n-alert
      v-if="availabilityLoaded && !allowRegistration"
      type="warning"
      title="注册暂不可用"
      class="text-sm"
    >
      {{ availabilityMessage }}
    </n-alert>

    <n-form
      ref="formRef"
      :model="formModel"
      :rules="rules"
      size="large"
      class="flex flex-col gap-4"
    >
      <n-form-item path="email" label="邮箱">
        <n-input
          v-model:value="formModel.email"
          placeholder="you@example.com"
          type="text"
          clearable
        />
      </n-form-item>
      <n-form-item path="displayName" label="显示名称 (可选)">
        <n-input
          v-model:value="formModel.displayName"
          placeholder="请输入显示名称"
          clearable
        />
      </n-form-item>
      <n-form-item path="password" label="密码">
        <n-input
          v-model:value="formModel.password"
          type="password"
          placeholder="请输入密码（至少 6 位）"
          show-password-on="click"
        />
      </n-form-item>
      <n-form-item path="confirmPassword" label="确认密码">
        <n-input
          v-model:value="formModel.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          show-password-on="click"
        />
      </n-form-item>
      <n-button
        type="primary"
        block
        :loading="auth.loading"
        :disabled="!allowRegistration"
        @click.prevent="handleSubmit"
      >
        注册
      </n-button>
    </n-form>

    <div class="text-center text-sm text-slate-500">
      已有账号？
      <RouterLink class="text-primary-500 transition hover:opacity-80" :to="{ name: 'login' }">
        去登录
      </RouterLink>
    </div>
  </div>
</template>
