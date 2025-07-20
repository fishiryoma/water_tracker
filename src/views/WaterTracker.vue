<template>
  <h1 class="text-3xl font-bold text-gray-800">今日喝水紀錄</h1>
  <div>
    <div v-if="remainingWater > 0" class="text-3xl font-bold text-gray-700">
      {{ dailyTarget }} - {{ todayDrank }} =
      <span class="text-primary-500">{{ remainingWater }}</span>
    </div>
    <div class="text-lg text-gray-800 mt-2">
      <p v-if="remainingWater > 0">
        還差 <span class="text-2xl font-bold text-primary-500">{{ remainingWater }}</span> ml
        達到目標
      </p>
      <p v-else class="text-green-700">恭喜！您已達成今日目標！</p>
    </div>
  </div>
  <div class="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
    <div
      class="bg-amber-300 h-6 rounded-full transition-all duration-500 ease-out"
      :style="{ width: progressPercentage + '%' }"
    ></div>
    <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
      {{ progressPercentage.toFixed(0) }}%
    </span>
  </div>

  <div class="grid grid-cols-2 gap-4 w-full max-w-xs">
    <button
      v-for="amount in waterOptions"
      :key="amount"
      @click="addWater(amount)"
      class="bg-primary-700/30 hover:bg-primary-700/80 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg"
    >
      +{{ amount }}
    </button>
  </div>

  <div class="flex gap-4 items-center">
    <input
      type="number"
      step="100"
      min="0"
      :max="dailyTarget - todayDrank"
      v-model.number="inputDrank"
      placeholder="例如: 200"
      inputmode="numeric"
      pattern="[0-9]*"
      class="shadow appearance-none rounded w-52 py-3 px-4 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline text-center text-xl"
    />
    <button
      @click="(addWater(inputDrank), (inputDrank = 0))"
      class="bg-primary-700/30 hover:bg-primary-700/80 text-white font-bold py-3 px-4 w-24 rounded-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out text-lg"
    >
      送出
    </button>
  </div>

  <p class="text-gray-400">FYI咖啡跟茶不算水唷</p>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, onValue, update } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'

const { getUserPath } = storeToRefs(useUserIdStore())

// 響應式數據
const dailyTarget = ref<number>(0) // 每日喝水目標
const todayDrank = ref<number>(0) // 今日已喝水量
const inputDrank = ref<number>(0) // input輸入喝水量
const todayDate = ref<string>('') // 今日日期，格式為 YYYY-MM-DD

// 計算屬性
const remainingWater = computed<number>(() => {
  return Math.max(0, dailyTarget.value - todayDrank.value)
})

const progressPercentage = computed<number>(() => {
  if (dailyTarget.value === 0) return 0
  return Math.min(100, (todayDrank.value / dailyTarget.value) * 100)
})

// --- UI ----
const waterOptions = [250, 500]

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
  const targetRef = dbRef(database, `${getUserPath.value}/waterTarget`)
  onValue(
    targetRef,
    (snapshot) => {
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
  const todayDrankRef = dbRef(
    database,
    `${getUserPath.value}/dailyRecords/${todayDate.value}/totalDrank`,
  )
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
  const recordPath = `${getUserPath.value}/dailyRecords/${todayDate.value}`

  try {
    await update(dbRef(database, recordPath), {
      totalDrank: newTotalDrank,
      [`logs/${Date.now()}`]: amount, // 紀錄每次喝水時間和數量
    })
  } catch (error) {
    console.error('增加喝水紀錄失敗:', error)
  }
}
</script>

<style scoped></style>
