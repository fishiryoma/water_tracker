<template>
  <PageLoading :isLoading="isLoading" />
  <template v-if="!isLoading">
    <CircularProgress ref="circularProgressRef" :percentage="progressPercentage">
      <template #center>
        <div v-if="remainingWater > 0" class="flex flex-col items-center z-1 gap-1">
          <span class="text-2xl font-bold text-gray-800">
            {{ progressPercentage.toFixed(0) }}%
          </span>
          <span class="text-sm text-gray-800 font-bold">
            {{ todayDrank }} / {{ dailyTarget }} ml
          </span>
        </div>
        <div v-else class="flex flex-col items-center z-1 gap-2">
          <div class="text-2xl font-bold text-sky-800 shiny-text">{{ progressPercentage.toFixed(0) }}%</div>
          <span class="text-sm text-sky-800 font-bold"> {{ todayDrank }} ml </span>
        </div>
      </template>
    </CircularProgress>

    <div class="grid grid-cols-3 gap-2 w-full">
      <Button
        v-for="amount in waterOptions"
        :key="amount"
        @click="addWater(amount, $event)"
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
        :placeholder="t('PLACEHOLDER.WATER_INTAKE')"
        inputmode="numeric"
        pattern="[0-9]*"
      />
      <Button ref="cusButton" @click="(addWater(inputDrank, $event), (inputDrank = 0))">
        {{ $t('BUTTON.SEND') }}
      </Button>
    </div>

    <div @click="handleCalendarClick" class="cursor-pointer flex flex-col gap-2 mt-4">
      <CalendarPanel :weeklyDrank="weekDates" />
    </div>

    <p class="text-gray-400">{{ $t('TRACKER.NOTE') }}</p>
  </template>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue'
import FormInput from '@/components/FormInput.vue'
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, onValue, update } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { useGlobalErrorStore } from '@/stores/globalError'
import { storeToRefs } from 'pinia'
import { useWaterStore } from '@/stores/water'
import { useWeeklyStore } from '@/stores/weekly'
import CircularProgress from '@/components/CircularProgress.vue'
import { formatDateToUserTimeZone, getWeekDates, weekStatus } from '@/utils'
import CalendarPanel from '@/components/CalendarPanel.vue'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useI18n } from 'vue-i18n'
import PageLoading from '@/components/PageLoading.vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const router = useRouter()

const { t } = useI18n()

gsap.registerPlugin(MotionPathPlugin)

const { getUserPath } = storeToRefs(useUserIdStore())
const errorStore = useGlobalErrorStore()
const { water: dailyTarget } = storeToRefs(useWaterStore())
const { addSubscriber, removeSubscriber } = useWeeklyStore()
const { weeklyDrank } = storeToRefs(useWeeklyStore())

// 響應式數據
const todayDrank = ref<number>(0) // 今日已喝水量
const inputDrank = ref<number>(0) // input輸入喝水量
const todayDate = ref<string>('') // 今日日期，格式為 YYYY-MM-DD
const unsubs: Array<() => void> = [] // Firebase 監聽取消函式收集
const circularProgressRef = ref<InstanceType<typeof CircularProgress> | null>(null)
const isTargetLoading = ref(true)
const isDrankLoading = ref(true)

// 計算屬性
const isLoading = computed(() => isTargetLoading.value || isDrankLoading.value)

const remainingWater = computed<number>(() => {
  return Math.max(0, dailyTarget.value - todayDrank.value)
})

const progressPercentage = computed<number>(() => {
  if (dailyTarget.value === 0) return 0
  return (todayDrank.value / dailyTarget.value) * 100
})

const weekDates = computed(() => {
  const result: Record<string, { finished: boolean; status: string }> = {}
  for (const data of weekStatus(getWeekDates())) {
    result[data.date] = {
      finished: weeklyDrank.value?.[data.date]?.finished ?? false,
      status: data.status,
    }
  }
  return result
})

// --- UI ----
const waterOptions = [350, 500, 750]

// --- Firebase 數據操作 ---

// 取得今天的日期 (YYYY-MM-DD 格式)
const getTodayDate = (): string => {
  return formatDateToUserTimeZone(new Date())
}

onMounted(() => {
  todayDate.value = getTodayDate()

  // 1. 監聽每日喝水目標
  const targetRef = dbRef(database, `${getUserPath.value}/waterTarget`)
  unsubs.push(
    onValue(
      targetRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data !== null) {
          dailyTarget.value = data
        } else {
          dailyTarget.value = 0
        }
        isTargetLoading.value = false
      },
      (error) => {
        console.error('讀取喝水目標失敗:', error)
        errorStore.handleFirebaseError(error, t('ERROR.READ_TARGET'))
        isTargetLoading.value = false
      },
    ),
  )

  // 2. 監聽今日已喝水量
  const todayDrankRef = dbRef(
    database,
    `${getUserPath.value}/dailyRecords/${todayDate.value}/totalDrank`,
  )
  unsubs.push(
    onValue(
      todayDrankRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data !== null) {
          todayDrank.value = data
        } else {
          todayDrank.value = 0 // 如果今天還沒有紀錄，則為 0
        }
        isDrankLoading.value = false
      },
      (error) => {
        console.error('讀取今日喝水紀錄失敗:', error)
        errorStore.handleFirebaseError(error, t('ERROR.READ_TODAY'))
        isDrankLoading.value = false
      },
    ),
  )
  addSubscriber()
})

const handleCalendarClick = () => {
  const date = dayjs().format('YYYY-MM-DD')
  nextTick()
  router.push({
    name: 'weekIntake',
    params: { date },
  })
}

onUnmounted(() => {
  unsubs.forEach((fn) => fn())
  removeSubscriber()
})

const calculateTrajectory = (fromEl: HTMLElement, toEl: HTMLElement) => {
  const fromRect = fromEl.getBoundingClientRect()
  const toRect = toEl.getBoundingClientRect()
  const start = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 }
  const end = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 }
  const mid = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 80 }
  return { start, mid, end }
}

// 水珠飛行函式
const launchWaterDroplet = (fromEl: HTMLElement, toEl: HTMLElement, amount: number) => {
  const droplet = createDroplet(amount)
  const trajectory = calculateTrajectory(fromEl, toEl)
  animateDroplet(droplet, trajectory)
}

const createDroplet = (amount: number) => {
  const droplet = document.createElement('div')
  const size = Math.max(10, 35 * Math.min(1, amount / dailyTarget.value))
  droplet.style.cssText = `
      position: fixed; left: 0px; top: 0px;
      width: ${size}px; height: ${size}px;
      border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(135,206,250,0.7), rgba(30,144,255,0.6));
      box-shadow: 0 2px 8px rgba(30,144,255,0.4);
      z-index: 10000; pointer-events: none;
    `
  return droplet
}

interface Trajectory {
  start: { x: number; y: number }
  mid: { x: number; y: number }
  end: { x: number; y: number }
}

const animateDroplet = (droplet: HTMLElement, trajectory: Trajectory) => {
  document.body.appendChild(droplet)

  gsap.set(droplet, {
    x: trajectory.start.x - 10,
    y: trajectory.start.y - 10,
    scale: 0.5,
  })

  const tl = gsap.timeline({
    onComplete: () => {
      droplet.remove()
      circularProgressRef.value?.exciteWaves()
    },
  })

  // 先放大
  tl.to(droplet, { scale: 1, duration: 0.1 })
    .to(
      droplet,
      {
        motionPath: {
          path: `M${trajectory.start.x},${trajectory.start.y} Q${trajectory.mid.x},${trajectory.mid.y} ${trajectory.end.x},${trajectory.end.y}`,
          autoRotate: false,
        },
        rotation: 360,
        duration: 0.8,
        ease: 'power2.out',
      },
      '<',
    )
    // 最後縮小淡出
    .to(droplet, { scale: 0.3, opacity: 0.7, duration: 0.3 }, '<0.5')
}

// 增加喝水量
const addWater = async (amount: number, event: Event) => {
  if (amount <= 0) return
  // 1. 先發射水珠動畫
  const targetEl = circularProgressRef.value?.rootEl
  const buttonEl = event.target as HTMLElement
  if (!targetEl) return

  launchWaterDroplet(buttonEl, targetEl, amount)

  const updateWaterData = async (amount: number) => {
    const newTotalDrank = todayDrank.value + amount
    const recordPath = `${getUserPath.value}/dailyRecords/${todayDate.value}`

    const isFinished = newTotalDrank >= dailyTarget.value
    try {
      await update(dbRef(database, recordPath), {
        finished: isFinished,
        totalDrank: newTotalDrank,
        [`logs/${Date.now()}`]: amount,
      })
    } catch (error) {
      console.error('增加喝水紀錄失敗:', error)
      errorStore.handleFirebaseError(error, t('ERROR.ADD_WATER'))
    }
  }

  // 2. 延遲更新數據（等水珠到達）
  setTimeout(() => {
    updateWaterData(amount)
  }, 800) // 飛行時間
}
</script>

<style scoped></style>
