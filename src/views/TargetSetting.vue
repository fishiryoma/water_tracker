<template>
  <h1 class="sm:text-3xl text-xl font-bold text-gray-800">已設定的目標</h1>
  <p>
    <span class="font-semibold text-primary-700 sm:text-3xl text-xl">{{ currentTarget }}</span> ml
  </p>
  <div class="w-full">
    <FormInput
      type="number"
      step="100"
      id="targetAmount"
      v-model.number="targetAmount"
      placeholder="例如: 2000"
      inputmode="numeric"
      pattern="[0-9]*"
    />
  </div>
  <div class="flex gap-3">
    <Button @click="saveTarget">儲存目標</Button>
    <Button>
      <RouterLink to="/tracker">返回</RouterLink>
    </Button>
  </div>
  <p v-if="message" :class="messageTypeClass" class="mt-4 text-sm">{{ message }}</p>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue'
import FormInput from '@/components/FormInput.vue'
import { ref, onMounted, computed } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, set, onValue } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'

const { getUserPath } = storeToRefs(useUserIdStore())
const testId = `${getUserPath.value}/waterTarget`

const targetAmount = ref<number | null>(null)
const currentTarget = ref<number>(0)
const message = ref<string>('')
const messageType = ref<string>('')

const messageTypeClass = computed(() => {
  return {
    'text-green-600': messageType.value === 'success',
    'text-red-600': messageType.value === 'error',
  }
})

onMounted(() => {
  const targetRef = dbRef(database, testId)

  onValue(
    targetRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data !== null) {
        currentTarget.value = data
        targetAmount.value = data
      } else {
        currentTarget.value = 1000
      }
    },
    (error) => {
      console.error('讀取喝水目標失敗:', error)
      message.value = '讀取目標失敗，請檢查網路或 Firebase 設定。'
      messageType.value = 'error'
    },
  )
})

const saveTarget = async () => {
  if (targetAmount.value === null || targetAmount.value <= 0) {
    message.value = '你要確定欸⁉️'
    messageType.value = 'error'
    return
  }

  try {
    await set(dbRef(database, testId), targetAmount.value)
    message.value = '✅目標更新成功'
    messageType.value = 'success'
  } catch (error) {
    console.error('儲存喝水目標失敗:', error)
    message.value = '儲存目標失敗，請檢查網路或 Firebase 設定。'
    messageType.value = 'error'
  }
}
</script>

<style scoped></style>
