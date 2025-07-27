<template>
  <button :class="mergedClass">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps({
  outerClass: {
    type: [String, Array],
    default: '',
  },
})
const defaultCalss =
  'bg-primary-700/30 hover:bg-primary-700/80 text-white font-bold sm:py-3 sm:w-24 w-20 py-2 rounded-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out sm:text-lg text-sm'

const mergedClass = computed(() => {
  return [defaultCalss, props.outerClass]
})
</script>
