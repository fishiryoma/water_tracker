<template>
  <div
    v-if="show"
    class="flex items-center justify-center gap-1"
    :class="props.layout === 'vertical' ? 'flex-col' : 'flex-row'"
  >
    <div :class="mergedSpinClass"></div>
    <p :class="mergedTextClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { twMerge } from 'tailwind-merge'

interface Props {
  show: boolean
  message?: string
  spinClass?: string
  textClass?: string
  layout?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  message: '',
  spinClass: '',
  textClass: '',
  layout: 'horizontal',
})

const mergedSpinClass = computed(() => {
  return twMerge([
    'animate-spin border-4 border-gray-200 border-t-4 border-t-primary-500 rounded-full w-4 h-4',
    props.spinClass,
  ])
})

const mergedTextClass = computed(() => {
  return twMerge(['text-gray-600 text-xs', props.textClass])
})
</script>
