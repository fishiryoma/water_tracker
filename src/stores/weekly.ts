import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, onValue } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { useGlobalErrorStore } from '@/stores/globalError'
import { getWeekDates } from '@/utils'

export interface DailyRecord {
  finished?: boolean
  totalDrank?: number
  logs?: Record<string, number>
}

export const useWeeklyStore = defineStore('weekly', () => {
  const { getUserPath } = storeToRefs(useUserIdStore())
  const errorStore = useGlobalErrorStore()

  const records = ref<Record<string, DailyRecord>>({})
  const subscribed = ref(false)
  let unsubscribe: (() => void) | null = null
  const subscribers = ref(0)
  const isInitialDataLoaded = ref(false)

  const isLoading = computed(() => !isInitialDataLoaded.value)

  // 啟動單一 onValue 監聽，避免多處重複連線
  function start() {
    if (subscribed.value) return
    const path = `${getUserPath.value}/dailyRecords`
    const r = dbRef(database, path)
    unsubscribe = onValue(
      r,
      (snap) => {
        const data = (snap.val() || {}) as Record<string, DailyRecord>
        records.value = data || {}
        isInitialDataLoaded.value = true
      },
      (err) => {
        console.error(' weekly 紀錄監聽失敗:', err)
        errorStore.handleFirebaseError(err, '監聽 weekly 資料')
        isInitialDataLoaded.value = true // 發生錯誤時也標記為載入完成，避免無限載入
      },
    )
    subscribed.value = true
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    subscribed.value = false
    isInitialDataLoaded.value = false // 停止監聽後，重置載入狀態
  }

  function addSubscriber() {
    subscribers.value++
    if (subscribers.value === 1) start()
  }
  function removeSubscriber() {
    subscribers.value = Math.max(0, subscribers.value - 1)
    if (subscribers.value === 0) stop()
  }

  const weekDays = computed(() => getWeekDates(true))

  const weeklyDrank = computed(() => {
    const out: Record<string, any> = {}
    for (const d of weekDays.value) {
      out[d] = records.value[d] || null
    }
    return out
  })

  // 元件卸載時，若沒有人訂閱就關閉
  onUnmounted(() => {
    if (subscribers.value === 0) stop()
  })

  function getRecordsForWeek(date: Date | string) {
    const dateString = typeof date === 'string' ? date : date.toISOString().slice(0, 10)
    const weekDates = getWeekDates(true, dateString)
    const weekRecords: Record<string, DailyRecord> = {}
    for (const d of weekDates) {
      weekRecords[d] = records.value[d] || {}
    }
    return weekRecords
  }

  return {
    records,
    subscribed,
    weeklyDrank,
    isLoading,
    addSubscriber,
    removeSubscriber,
    getRecordsForWeek,
  }
})
