<template>
  <div class="p-6 flex justify-center items-center h-full">
    <div
      class="px-10 py-24 min-w-[330px] bg-pink-50 hover:bg-white/80 focus:bg-white/80 rounded-xl shadow-lg text-center flex flex-col gap-6 justify-center items-center duration-200"
    >
      <h1 class="text-3xl font-bold text-gray-800">已設定的目標</h1>
      <p>
        <span class="font-semibold text-pink-700 text-3xl">{{ currentTarget }}</span> ml
      </p>
      <div class="w-full">
        <input
          type="number"
          step="100"
          id="targetAmount"
          v-model.number="targetAmount"
          placeholder="例如: 2000"
          inputmode="numeric"
          pattern="[0-9]*"
          class="shadow appearance-none rounded w-full py-3 px-4 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline text-center text-xl"
        />
      </div>
      <div class="flex gap-3">
        <button
          @click="saveTarget"
          class="bg-pink-600/40 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg"
        >
          儲存目標
        </button>
        <button
          class="text-pink-200 font-bold py-3 px-6 text-lg hover:text-black transition duration-300"
        >
          <RouterLink to="/tracker">返回</RouterLink>
        </button>
      </div>

      <p v-if="message" :class="messageTypeClass" class="mt-4 text-sm">{{ message }}</p>
    </div>
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
    message.value = '你要確定欸⁉️'
    messageType.value = 'error'
    return
  }

  try {
    await set(dbRef(database, 'waterTarget'), targetAmount.value)
    message.value = '✅目標更新成功'
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
