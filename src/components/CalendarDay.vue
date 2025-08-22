<template>
  <div :class="mergedClass">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { twMerge } from 'tailwind-merge'

const props = defineProps({
  className: {
    type: String,
    default: '',
  },
})

const mergedClass = computed(() => {
  return twMerge([
    'sm:px-1.5 px-1 py-2 flex justify-center items-center text-primary-800',
    props.className,
  ])
})
</script>
