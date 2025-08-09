import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface GlobalError {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
  timestamp: Date
  details?: string
  action?: {
    label: string
    handler: () => void
  }
}

export const useGlobalErrorStore = defineStore('globalError', () => {
  const errors = ref<GlobalError[]>([])
  const isVisible = ref(false)

  // 添加錯誤
  const addError = (
    message: string,
    type: GlobalError['type'] = 'error',
    details?: string,
    action?: GlobalError['action'],
  ) => {
    const error: GlobalError = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      details,
      action,
    }

    errors.value.push(error)
    isVisible.value = true

    // 自動移除錯誤 (除非是嚴重錯誤)
    setTimeout(() => {
      removeError(error.id)
    }, 3000)

    return error.id
  }

  // 移除錯誤
  const removeError = (id: string) => {
    const index = errors.value.findIndex((error) => error.id === id)
    if (index > -1) {
      errors.value.splice(index, 1)
    }

    if (errors.value.length === 0) {
      isVisible.value = false
    }
  }

  // 清除所有錯誤
  const clearAllErrors = () => {
    errors.value = []
    isVisible.value = false
  }

  // 便捷方法
  const showError = (message: string, details?: string, action?: GlobalError['action']) => {
    return addError(message, 'error', details, action)
  }

  const showWarning = (message: string, details?: string) => {
    return addError(message, 'warning', details)
  }

  const showInfo = (message: string, details?: string) => {
    return addError(message, 'info', details)
  }

  // 網路錯誤處理
  const handleNetworkError = (error: any, context: string) => {
    const message = '網路連線發生問題'
    let details = `在 ${context} 時發生錯誤`

    if (error?.message) {
      details += `：${error.message}`
    }

    return showError(message, details, {
      label: '重試',
      handler: () => window.location.reload(),
    })
  }

  // Firebase 錯誤處理
  const handleFirebaseError = (error: any, context: string) => {
    let message = '資料同步發生問題'
    let details = `在 ${context} 時發生錯誤`

    if (error?.code) {
      switch (error.code) {
        case 'permission-denied':
          message = '權限不足'
          details = '您沒有執行此操作的權限'
          break
        case 'network-request-failed':
          message = '網路連線失敗'
          details = '請檢查您的網路連線'
          break
        case 'unavailable':
          message = '服務暫時無法使用'
          details = '請稍後再試'
          break
        default:
          details += `：${error.message || error.code}`
      }
    }

    return showError(message, details)
  }

  return {
    errors,
    isVisible,
    addError,
    removeError,
    clearAllErrors,
    showError,
    showWarning,
    showInfo,
    handleNetworkError,
    handleFirebaseError,
  }
})
