<template>
  <div :class="['flex flex-col', outerClass]">
    <label v-if="label" :for="inputId" class="mb-1 text-sm font-bold text-gray-700">{{
      label
    }}</label>
    <input :id="inputId" :class="mergedClass" v-model="model" v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { twMerge } from 'tailwind-merge'
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
    type: [String],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: () => `form-input-${Math.random().toString(36).substring(2, 9)}`,
  },
})

const model = defineModel<number | string | null>({ default: null })

const inputId = computed(() => props.id)

const mergedClass = computed(() => {
  return twMerge(
    'shadow appearance-none rounded-xl w-full max-w-[200px] sm:py-3 py-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline text-center sm:text-xl text-md',
    props.outerClass,
  )
})
</script>
