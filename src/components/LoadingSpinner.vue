<template>
  <div v-if="show" class="flex items-center justify-center gap-1">
    <div
      class="animate-spin border-4 border-gray-200 border-t-4 border-t-primary-500 rounded-full w-4 h-4"
    ></div>
    <p class="text-gray-600 text-xs">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: '載入中...'
})
</script>