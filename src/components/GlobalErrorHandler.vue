<template>
  <!-- 全局錯誤顯示 -->
  <Teleport to="body">
    <div v-if="errorStore.isVisible" class="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      <TransitionGroup name="error-slide" tag="div" class="space-y-2">
        <div
          v-for="error in errorStore.errors"
          :key="error.id"
          :class="getErrorClasses(error.type)"
          class="flex flex-col gap-1 p-2 rounded-xl shadow-lg backdrop-blur-sm"
        >
          <!-- 錯誤標題和關閉按鈕 -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1">
              <div :class="getIconClasses(error.type)">
                {{ getIcon(error.type) }}
              </div>
              <h4 class="font-semibold text-sm">{{ error.message }}</h4>
            </div>
            <button
              @click="errorStore.removeError(error.id)"
              class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- 錯誤詳情 -->
          <div v-if="error.details" class="text-xs text-gray-600">
            {{ error.details }}
          </div>

          <!-- 時間戳記 -->
          <div class="text-xs text-gray-400">
            {{ formatTime(error.timestamp) }}
          </div>

          <!-- 操作按鈕 -->
          <div v-if="error.action" class="flex gap-2">
            <button
              @click="handleAction(error)"
              class="px-3 py-1 text-xs bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              {{ error.action.label }}
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- 清除所有按鈕 -->
      <div v-if="errorStore.errors.length > 1" class="text-center">
        <button
          @click="errorStore.clearAllErrors()"
          class="text-xs text-gray-500 hover:text-gray-700 hover:bg-white hover:rounded-xl hover:px-2 hover:py-1 cursor-pointer"
        >
          {{ $t('BUTTON.CLEAR_ALL') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useGlobalErrorStore, type GlobalError } from '@/stores/globalError'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const errorStore = useGlobalErrorStore()

const getErrorClasses = (type: GlobalError['type']) => {
  const baseClasses = ''

  switch (type) {
    case 'error':
      return `${baseClasses} bg-red-100/60 text-red-800`
    case 'warning':
      return `${baseClasses} bg-amber-100/60 text-amber-800`
    case 'info':
      return `${baseClasses} bg-blue-100/60 text-blue-800`
    default:
      return `${baseClasses} bg-gray-100/60 text-gray-800`
  }
}

const getIconClasses = (type: GlobalError['type']) => {
  switch (type) {
    case 'error':
      return 'text-red-500'
    case 'warning':
      return 'text-amber-500'
    case 'info':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

const getIcon = (type: GlobalError['type']) => {
  switch (type) {
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    default:
      return '📢'
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleAction = (error: GlobalError) => {
  if (error.action) {
    error.action.handler()
    errorStore.removeError(error.id)
  }
}
</script>

<style scoped>
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.error-slide-move {
  transition: transform 0.3s ease;
}
</style>
