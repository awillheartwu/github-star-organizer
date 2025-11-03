<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NTag,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { formatDate } from '../../utils/format'
import { useMessage } from '../../utils/feedback'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const auth = useAuthStore()
const { user, ready } = storeToRefs(auth)
const refreshing = ref(false)
const changing = ref(false)
const changeForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const router = useRouter()
const message = useMessage()
const detailCardStyle = DETAIL_CARD_STYLE
const isAdmin = computed(() => user.value?.role === 'ADMIN')

async function refreshProfile() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await auth.fetchMe()
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  if (!ready.value) {
    await auth.initialize()
  }
  if (!user.value) {
    await refreshProfile()
  }
})

function resetChangeForm() {
  changeForm.oldPassword = ''
  changeForm.newPassword = ''
  changeForm.confirmPassword = ''
}

async function handleChangePassword() {
  if (!changeForm.oldPassword || !changeForm.newPassword || !changeForm.confirmPassword) {
    message.warning('请填写完整的密码信息')
    return
  }
  if (changeForm.newPassword.length < 6) {
    message.warning('新密码长度至少为 6 位')
    return
  }
  if (changeForm.newPassword !== changeForm.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }

  changing.value = true
  try {
    await auth.changePassword({
      oldPassword: changeForm.oldPassword,
      newPassword: changeForm.newPassword,
    })
    resetChangeForm()
    message.success('密码修改成功，请重新登录')
    await router.push({ name: 'login' })
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">账户信息</h2>
        <p class="text-sm text-slate-500">查看并管理当前登录用户的基本资料</p>
      </div>
      <n-button size="small" :loading="refreshing" @click="refreshProfile">刷新</n-button>
    </div>

    <n-card :style="detailCardStyle">
      <template v-if="user" #header>
        <div class="flex items-center gap-3">
          <span class="text-base font-semibold text-slate-900">基本资料</span>
          <n-tag v-if="user.role" size="small" type="info">{{ user.role }}</n-tag>
        </div>
      </template>
      <template v-if="user" #default>
        <n-descriptions label-placement="left" bordered :column="1">
          <n-descriptions-item label="名称">{{ user.name ?? '未设置' }}</n-descriptions-item>
          <n-descriptions-item label="邮箱">{{ user.email ?? '未设置' }}</n-descriptions-item>
          <n-descriptions-item v-if="isAdmin" label="用户 ID">{{ user.sub }}</n-descriptions-item>
          <n-descriptions-item label="创建时间">{{
            formatDate(user.createdAt)
          }}</n-descriptions-item>
          <n-descriptions-item label="最近更新">{{
            formatDate(user.updatedAt)
          }}</n-descriptions-item>
        </n-descriptions>
      </template>
      <template v-else #default>
        <n-alert type="warning" title="暂无数据" :closable="false">
          尚未获取到用户信息，请点击右上角“刷新”重试。
        </n-alert>
      </template>
    </n-card>

    <n-card :style="detailCardStyle">
      <template #header>
        <span class="text-base font-semibold text-slate-900">安全设置</span>
      </template>
      <div class="flex flex-col gap-4">
        <n-form label-placement="left" label-width="88">
          <n-form-item label="旧密码">
            <n-input
              v-model:value="changeForm.oldPassword"
              type="password"
              show-password-on="click"
              placeholder="输入旧密码"
            />
          </n-form-item>
          <n-form-item label="新密码">
            <n-input
              v-model:value="changeForm.newPassword"
              type="password"
              show-password-on="click"
              placeholder="输入新密码"
            />
          </n-form-item>
          <n-form-item label="确认密码">
            <n-input
              v-model:value="changeForm.confirmPassword"
              type="password"
              show-password-on="click"
              placeholder="再次输入新密码"
            />
          </n-form-item>
        </n-form>
        <n-space>
          <n-button type="primary" :loading="changing" @click="handleChangePassword"
            >确认修改</n-button
          >
          <n-button tertiary :disabled="changing" @click="resetChangeForm">清空</n-button>
          <n-button secondary :loading="refreshing" @click="refreshProfile"
            >重新拉取账号信息</n-button
          >
        </n-space>
      </div>
    </n-card>
  </div>
</template>
