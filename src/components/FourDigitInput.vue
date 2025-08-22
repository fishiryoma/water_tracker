<template>
  <div class="flex justify-center items-start gap-4">
    <DigitSpinner v-model="digits[0]" />
    <DigitSpinner v-model="digits[1]" />
    <DigitSpinner v-model="digits[2]" />
    <DigitSpinner v-model="digits[3]" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import DigitSpinner from './DigitSpinner.vue'

const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits(['update:modelValue'])

const digits = ref([0, 0, 0, 0])

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === null || isNaN(newValue)) {
      digits.value = [0, 0, 0, 0]
      return
    }
    const paddedValue = String(newValue).padStart(4, '0')
    digits.value = paddedValue.split('').map(Number)
  },
  { immediate: true }
)

watch(
  digits,
  (newDigits) => {
    const combinedValue = parseInt(newDigits.join(''), 10)
    if (props.modelValue !== combinedValue) {
      emit('update:modelValue', combinedValue)
    }
  },
  { deep: true }
)
</script>
