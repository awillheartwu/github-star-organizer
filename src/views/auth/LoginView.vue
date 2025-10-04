<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInst, FormRules } from 'naive-ui'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const formRef = ref<FormInst | null>(null)
const formModel = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: ['input', 'blur'] },
    { type: 'email', message: '邮箱格式不正确', trigger: ['input', 'blur'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: ['input', 'blur'] }],
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  try {
    await auth.login({ email: formModel.email, password: formModel.password })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
    if (redirect) {
      await router.replace(redirect)
    } else {
      await router.replace({ name: 'projects' })
    }
  } catch (error) {
    // 提示已由 store 处理
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="text-center">
      <h1 class="text-2xl font-semibold text-slate-900">登录</h1>
      <p class="text-sm text-slate-500">访问 GitHub Star Organizer 管理面板</p>
    </div>
    <n-form ref="formRef" :model="formModel" :rules="rules" size="large" class="flex flex-col gap-4">
      <n-form-item path="email" label="邮箱">
        <n-input v-model:value="formModel.email" placeholder="you@example.com" type="text" clearable />
      </n-form-item>
      <n-form-item path="password" label="密码">
        <n-input
          v-model:value="formModel.password"
          type="password"
          placeholder="请输入密码"
          show-password-on="click"
        />
      </n-form-item>
      <n-button type="primary" block :loading="auth.loading" @click.prevent="handleSubmit">
        登录
      </n-button>
    </n-form>
  </div>
</template>
