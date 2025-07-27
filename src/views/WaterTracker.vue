<template>
  <h1 class="sm:text-3xl text-xl font-bold text-gray-800">今日喝水紀錄</h1>
  <div>
    <div v-if="remainingWater > 0" class="sm:text-3xl text-xl font-bold text-gray-700">
      {{ dailyTarget }} - {{ todayDrank }} =
      <span class="text-primary-500">{{ remainingWater }}</span>
    </div>
    <div class="sm:text-lg text-md text-gray-800 mt-2">
      <p v-if="remainingWater > 0">
        還差
        <span class="sm:text-2xl text-md font-bold text-primary-500">{{ remainingWater }}</span> ml
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

  <div class="grid grid-cols-2 gap-2 w-full">
    <Button
      v-for="amount in waterOptions"
      :key="amount"
      @click="addWater(amount)"
      outerClass="w-full sm:w-full"
    >
      +{{ amount }}
    </Button>
  </div>

  <div class="flex gap-4 items-center justify-center w-full">
    <FormInput
      type="number"
      step="100"
      min="0"
      :max="dailyTarget - todayDrank"
      v-model.number="inputDrank"
      placeholder="例如: 250"
      inputmode="numeric"
      pattern="[0-9]*"
    />
    <Button @click="(addWater(inputDrank), (inputDrank = 0))"> 送出 </Button>
  </div>

  <p class="text-gray-400">FYI咖啡跟茶不算水唷</p>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue'
import FormInput from '@/components/FormInput.vue'
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
