<template>
  <div
    class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl text-center min-h-screen sm:min-h-0 sm:mt-10 sm:flex-initial flex flex-col justify-center items-center"
  >
    <h1 class="text-3xl font-bold text-gray-800 mb-6 lg:text-4xl">設定每日喝水目標</h1>
    <p class="text-lg text-gray-600 mb-4">
      目前的目標: <span class="font-semibold text-blue-600">{{ currentTarget }}</span> ml
    </p>

    <div class="mb-6 w-full">
      <label for="targetAmount" class="block text-gray-700 text-base font-bold mb-2"
        >設定目標 (ml):</label
      >
      <input
        type="number"
        id="targetAmount"
        v-model.number="targetAmount"
        placeholder="例如: 2000"
        class="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-center text-xl"
      />
    </div>

    <button
      @click="saveTarget"
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg"
    >
      儲存目標
    </button>

    <p v-if="message" :class="messageTypeClass" class="mt-4 text-sm">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, set, onValue } from 'firebase/database'

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
  const targetRef = dbRef(database, 'waterTarget')

  onValue(
    targetRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data !== null) {
        currentTarget.value = data
        targetAmount.value = data
      } else {
        currentTarget.value = 0
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
    message.value = '請輸入有效的喝水目標 (大於 0)。'
    messageType.value = 'error'
    return
  }

  try {
    await set(dbRef(database, 'waterTarget'), targetAmount.value)
    message.value = '喝水目標儲存成功！'
    messageType.value = 'success'
  } catch (error) {
    console.error('儲存喝水目標失敗:', error)
    message.value = '儲存目標失敗，請檢查網路或 Firebase 設定。'
    messageType.value = 'error'
  }
}
</script>

<style scoped>
/* 可以保持為空，或者放置極少量的自定義樣式 */
/* 例如，如果您需要更精細地控制一些在 Tailwind 中較難實現的特定動畫或屬性 */
</style>
