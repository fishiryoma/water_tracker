<template>
  <input :class="mergedClass" v-model="model" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  outerClass: {
    type: [String, Array],
    default: '',
  },
})

const model = defineModel<number | string | null>({ default: null })

const mergedClass = computed(() => {
  return [
    'shadow appearance-none rounded-xl w-full max-w-[200px] sm:py-3 py-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline text-center sm:text-xl text-md',
    props.outerClass,
  ]
})
</script>
