<template>
  <div class="flex flex-col items-center gap-3">
    <button @click="increment" :class="bigButtonBaseClass">
      <div :class="smallButtonBaseClass + ' border-b-10 border-b-gray-400 up-btn'"></div>
    </button>
    <span
      class="text-4xl font-bold text-primary-700/80 flex items-center justify-center select-none border-2 border-primary-700 py-2 px-4 rounded shadow-md"
      >{{ modelValue }}</span
    >
    <button @click="decrement" :class="bigButtonBaseClass">
      <div :class="smallButtonBaseClass + ' border-t-10 border-t-gray-400 down-btn'"></div>
    </button>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits(['update:modelValue'])

const increment = () => {
  const newValue = props.modelValue >= 9 ? 0 : props.modelValue + 1
  emit('update:modelValue', newValue)
}

const decrement = () => {
  const newValue = props.modelValue <= 0 ? 9 : props.modelValue - 1
  emit('update:modelValue', newValue)
}

const bigButtonBaseClass =
  'btn hover:bg-transparent flex justify-center align-center p-2 rounded-full bg-stone-100 cursor-pointer duration-200 shadow-sm hover:shadow-none'
const smallButtonBaseClass = 'w-0 h-0 border-x-6 border-x-transparent transition-colors'
</script>

<style scoped>
.btn:hover .up-btn {
  border-bottom: 10px solid #4b5563;
}
.btn:hover .down-btn {
  border-top: 10px solid #4b5563;
}
</style>
