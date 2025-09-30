<template>
  <button :class="mergedClass">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { twMerge } from 'tailwind-merge'

const props = defineProps({
  outerClass: {
    type: [String],
    default: '',
  },
})
const defaultCalss =
  'bg-primary-700/30 hover:bg-primary-700/80 text-white font-bold sm:py-3 sm:w-24 w-20 py-2 rounded-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out sm:text-lg text-sm cursor-pointer'

const mergedClass = computed(() => {
  return twMerge(defaultCalss, props.outerClass)
})
</script>
