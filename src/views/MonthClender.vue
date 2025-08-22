<template>
  <div class="w-full flex flex-col gap-2">
    <div v-if="isLoading" class="flex items-center justify-center w-full h-[400px]">
      <LoadingSpinner
        :show="true"
        spinClass="w-10 h-10"
        textClass="text-lg"
        :message="$t('LOADING.DEFAULT')"
        layout="vertical"
      />
    </div>
    <template v-else>
      <VCalendar
        min-date="2025-01-01"
        max-date="2025-12-31"
        expanded
        borderless
        transparent
        :attributes="attributes"
        @update:pages="handlePageUpdate"
        @dayclick="handleDayClick"
      />
      <div class="flex justify-center gap-2">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-[#FF5A79]"></div>
          <div>{{ $t('CLENDER.UNFINISHED') }}</div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-[#699F4C]"></div>
          <div>{{ $t('CLENDER.FINISHED') }}</div>
        </div>
      </div>
      <div>
        {{ $t('CLENDER.RATIO') }}：{{
          Math.round((completedDaysCount / attributes.length) * 100) || 0
        }}%
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref as dbRef, onValue, get, orderByKey, query, startAt, endAt } from 'firebase/database'
import { useRouter } from 'vue-router'
import { database } from '@/firebase'
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'
import { useGlobalErrorStore } from '@/stores/globalError'
import { formatDateToTaiwan, generateMonthDates } from '@/utils'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router = useRouter()

const { getUserPath } = storeToRefs(useUserIdStore())
const errorStore = useGlobalErrorStore()
const { t } = useI18n()

const _red = '#FF5A79'
const _green = '#699F4C'

const isLoading = ref(true)
const todayDate = ref<string>(formatDateToTaiwan(new Date()))
const queryRef = ref<{ month: number; year: number }>({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
})
const monthKey = computed(
  () => `${queryRef.value.year}-${String(queryRef.value.month).padStart(2, '0')}`,
)
const lastPageKey = ref('')
const monthlyRecords = ref<Record<string, { finished: boolean }>>({})
const todayRecord = ref<{ finished: boolean } | null>(null)
const unsubs: Array<() => void> = []
const allMonthDates = computed(() => {
  try {
    if (!queryRef.value.year || !queryRef.value.month) {
      return []
    }
    return generateMonthDates(queryRef.value.year, queryRef.value.month)
  } catch (error) {
    console.error('生成月份日期時發生錯誤:', error)
    return []
  }
})

const attributes = computed(() => {
  const attrs: Array<{
    dates: Date
    highlight: { style: { backgroundColor: string; color: string } }
  }> = []

  // 確保有年月資料才執行
  if (!queryRef.value.year || !queryRef.value.month) {
    return attrs
  }

  try {
    allMonthDates.value.forEach((dateStr) => {
      let color = _red
      if (dateStr === todayDate.value) {
        if (todayRecord.value?.finished === true) color = _green
      } else {
        const record = monthlyRecords.value[dateStr]
        if (record?.finished === true) color = _green
      }

      // 確保日期有效
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        attrs.push({
          dates: date,
          highlight: {
            style: {
              backgroundColor: color,
              color: '#fff',
            },
          },
        })
      }
    })
  } catch (error) {
    console.error('生成 attributes 時發生錯誤:', error)
  }

  return attrs
})

const completedDaysCount = computed(() => {
  try {
    return attributes.value.filter((attr) => attr.highlight?.style?.backgroundColor === _green)
      .length
  } catch (error) {
    console.error('計算完成天數時發生錯誤:', error)
    return 0
  }
})

// ========= 資料讀取 =========
const loadMonthlyData = async () => {
  isLoading.value = true
  const dates = allMonthDates.value
  if (dates.length === 0) {
    monthlyRecords.value = {}
    isLoading.value = false
    return
  }

  const recordsRef = dbRef(database, `${getUserPath.value}/dailyRecords`)
  try {
    const snapshot = await get(
      query(recordsRef, orderByKey(), startAt(dates[0]), endAt(dates[dates.length - 1])),
    )
    const allRecords = snapshot.val() || {}

    const result: Record<string, { finished: boolean }> = {}
    for (const d of dates) {
      const rec = allRecords[d]
      result[d] = { finished: rec?.finished === true }
    }

    monthlyRecords.value = result
  } catch (error) {
    console.error('讀取月份資料失敗:', error)
    errorStore.handleFirebaseError(error, t('ERROR.MONTH'))
  } finally {
    isLoading.value = false
  }
}

const watchTodayData = () => {
  unsubs.forEach((fn) => fn())
  unsubs.length = 0

  const todayRef = dbRef(database, `${getUserPath.value}/dailyRecords/${todayDate.value}`)
  const unsubscribe = onValue(
    todayRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data && typeof data.finished === 'boolean') {
        todayRecord.value = { finished: data.finished }
      } else {
        todayRecord.value = { finished: false }
      }
    },
    (error) => {
      console.error('監聽今日資料失敗:', error)
      errorStore.handleFirebaseError(error, t('ERROR.TODAY'))
      todayRecord.value = { finished: false }
    },
  )
  unsubs.push(unsubscribe)
}

onMounted(async () => {
  await loadMonthlyData()
  watchTodayData()
})

onUnmounted(() => {
  unsubs.forEach((fn) => fn())
})

const handlePageUpdate = (pages) => {
  const { year, month } = pages[0]
  const nextKey = `${year}-${String(month).padStart(2, '0')}`
  if (nextKey === lastPageKey.value) return
  lastPageKey.value = nextKey

  if (queryRef.value.year !== year) queryRef.value.year = year
  if (queryRef.value.month !== month) queryRef.value.month = month
}

watch(
  monthKey,
  async () => {
    await loadMonthlyData()
  },
  { flush: 'post' },
)

const handleDayClick = (day) => {
  const date = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  // 使用 setTimeout 加上微小延遲
  nextTick()
  // 不知道為什麼一導航就跳錯，解不了
  setTimeout(() => {
    try {
      router.push({
        name: 'weekIntake',
        params: { date },
      })
    } catch (e) {
      // 捕獲路由跳轉的錯誤
      console.error('路由跳轉失敗:', e)
    }
  }, 50) // 設定一個 50ms 的微小延遲
}
</script>
