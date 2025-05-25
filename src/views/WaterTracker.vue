<template>
  <div
    class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl text-center flex flex-col items-center"
  >
    <h1 class="text-3xl font-bold text-gray-800 mb-6 lg:text-4xl">今日喝水紀錄</h1>

    <div class="mb-4 text-lg text-gray-700">
      <p>
        您的每日目標: <span class="font-semibold text-blue-600">{{ dailyTarget }}</span> ml
      </p>
    </div>

    <div class="mb-6 text-2xl font-bold text-green-600">
      <p>今日已喝: {{ todayDrank }} ml</p>
    </div>

    <div class="mb-8 text-xl font-semibold text-gray-800">
      <p v-if="remainingWater > 0">
        還差: <span class="text-red-500">{{ remainingWater }}</span> ml 達到目標
      </p>
      <p v-else class="text-green-700">恭喜！您已達成今日目標！</p>
    </div>

    <div class="w-full bg-gray-200 rounded-full h-4 mb-8 relative overflow-hidden">
      <div
        class="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
        :style="{ width: progressPercentage + '%' }"
      ></div>
      <span
        class="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800"
      >
        {{ progressPercentage.toFixed(0) }}%
      </span>
    </div>

    <div class="grid grid-cols-2 gap-4 w-full max-w-xs">
      <button
        @click="addWater(250)"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg"
      >
        +250ml
      </button>
      <button
        @click="addWater(500)"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg"
      >
        +500ml
      </button>
      <button
        @click="addWater(1000)"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg col-span-2"
      >
        +1000ml
      </button>
    </div>

    <button
      @click="clearTodayRecord"
      class="mt-8 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-sm"
    >
      清空今日紀錄
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, onValue, set, update } from 'firebase/database'

// 響應式數據
const dailyTarget = ref<number>(0) // 每日喝水目標
const todayDrank = ref<number>(0) // 今日已喝水量
const todayDate = ref<string>('') // 今日日期，格式為 YYYY-MM-DD

// 計算屬性
const remainingWater = computed<number>(() => {
  return Math.max(0, dailyTarget.value - todayDrank.value)
})

const progressPercentage = computed<number>(() => {
  if (dailyTarget.value === 0) return 0
  return Math.min(100, (todayDrank.value / dailyTarget.value) * 100)
})

// --- Firebase 數據操作 ---

// 取得今天的日期 (YYYY-MM-DD 格式)
const getTodayDate = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  todayDate.value = getTodayDate()

  // 1. 監聽每日喝水目標
  const targetRef = dbRef(database, 'waterTarget')
  onValue(
    targetRef,
    (snapshot) => {
      console.log('eee', snapshot)
      const data = snapshot.val()
      if (data !== null) {
        dailyTarget.value = data
      } else {
        dailyTarget.value = 0
      }
    },
    (error) => {
      console.error('讀取喝水目標失敗:', error)
    },
  )

  // 2. 監聽今日已喝水量
  const todayDrankRef = dbRef(database, `dailyRecords/${todayDate.value}/totalDrank`)
  onValue(
    todayDrankRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data !== null) {
        todayDrank.value = data
      } else {
        todayDrank.value = 0 // 如果今天還沒有紀錄，則為 0
      }
    },
    (error) => {
      console.error('讀取今日喝水紀錄失敗:', error)
    },
  )
})

// 增加喝水量
const addWater = async (amount: number) => {
  const newTotalDrank = todayDrank.value + amount
  const recordPath = `dailyRecords/${todayDate.value}`

  try {
    // 使用 update 函數來更新特定路徑下的數據
    // 如果 dailyRecords/todayDate.value 不存在，它會自動創建
    await update(dbRef(database, recordPath), {
      totalDrank: newTotalDrank,
      // 您也可以在這裡記錄每次喝水的時間戳或其他細節，例如：
      // lastUpdateTime: Date.now(),
      // logs: { [Date.now()]: amount } // 紀錄每次喝水時間和數量
    })
    // todayDrank.value 會因為 onValue 監聽器自動更新，所以這裡不需要手動修改
  } catch (error) {
    console.error('增加喝水紀錄失敗:', error)
    // 可以在這裡顯示錯誤訊息給用戶
  }
}

// 清空今日紀錄 (方便測試用)
const clearTodayRecord = async () => {
  const recordPath = `dailyRecords/${todayDate.value}`
  if (confirm('確定要清空今日的喝水紀錄嗎？')) {
    try {
      await set(dbRef(database, recordPath), null) // 將該節點設為 null 即可刪除
      // todayDrank.value 會因為 onValue 監聽器自動更新為 0
      alert('今日紀錄已清空！')
    } catch (error) {
      console.error('清空紀錄失敗:', error)
      alert('清空紀錄失敗，請稍後再試。')
    }
  }
}
</script>

<style scoped>
/* 此處可以放置此元件特有的，Tailwind 無法直接實現的樣式 */
/* 例如，如果有複雜的動畫或特殊佈局 */
</style>
