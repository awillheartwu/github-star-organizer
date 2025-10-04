import { createDiscreteApi } from 'naive-ui'

const { message, notification, dialog, loadingBar } = createDiscreteApi([
  'message',
  'notification',
  'dialog',
  'loadingBar',
])

export const useMessage = () => message
export const useNotification = () => notification
export const useDialog = () => dialog
export const useLoadingBar = () => loadingBar
