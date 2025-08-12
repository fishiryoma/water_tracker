<template>
  <CircularProgress :percentage="progressPercentage">
    <template #center>
      <div v-if="remainingWater > 0" class="flex flex-col items-center z-1 gap-1">
        <span class="text-2xl font-bold text-gray-800"> {{ progressPercentage.toFixed(0) }}% </span>
        <span class="text-sm text-gray-800 font-bold"> {{ todayDrank }} / {{ dailyTarget }} ml </span>
      </div>
      <div v-else class="flex flex-col items-center z-1 gap-2">
        <div class="text-2xl font-bold text-sky-800">達 成</div>
        <span class="text-sm text-sky-800 font-bold"> {{ todayDrank }} ml </span>
      </div>
    </template>
  </CircularProgress>

  <div class="grid grid-cols-3 gap-2 w-full">
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
      :modelValue="inputDrank"
      @update:modelValue="(val: number) => (inputDrank = val)"
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
import { useGlobalErrorStore } from '@/stores/globalError'
import { storeToRefs } from 'pinia'
import { useWaterStore } from '@/stores/water'
import CircularProgress from '@/components/CircularProgress.vue'
import { formatDateToTaiwan } from '@/utils'

const { getUserPath } = storeToRefs(useUserIdStore())
const errorStore = useGlobalErrorStore()
const { water: dailyTarget } = storeToRefs(useWaterStore())

// 響應式數據
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
const waterOptions = [350, 500, 750]

// --- Firebase 數據操作 ---

// 取得今天的日期 (YYYY-MM-DD 格式)
const getTodayDate = (): string => {
  return formatDateToTaiwan(new Date())
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
      errorStore.handleFirebaseError(error, '讀取喝水目標')
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
      errorStore.handleFirebaseError(error, '讀取今日喝水紀錄')
    },
  )
})

// 增加喝水量
const addWater = async (amount: number) => {
  if (todayDrank.value >= dailyTarget.value) return

  const newTotalDrank = todayDrank.value + amount
  const recordPath = `${getUserPath.value}/dailyRecords/${todayDate.value}`

  const isOverTarget = newTotalDrank >= dailyTarget.value
  try {
    await update(dbRef(database, recordPath), {
      totalDrank: isOverTarget ? dailyTarget.value : newTotalDrank,
      [`logs/${Date.now()}`]: isOverTarget ? dailyTarget.value - todayDrank.value : amount, // 紀錄每次喝水時間和數量
    })
  } catch (error) {
    console.error('增加喝水紀錄失敗:', error)
    errorStore.handleFirebaseError(error, '增加喝水紀錄')
    // 錯誤已通過 errorStore 處理，不需要重新拋出
  }
}
</script>

<style scoped></style>
