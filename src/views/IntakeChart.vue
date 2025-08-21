<template>
  <h1 class="sm:text-3xl text-xl font-bold text-gray-800">{{ $t('TITLE.STATISTICS') }}</h1>
  <WaterIntakeBubble :bubblePoints="bubblePoints" />
</template>

<script setup lang="ts">
import WaterIntakeBubble from '@/components/WaterIntakeBubble.vue'
import { useRoute } from 'vue-router'
import { ref, watchEffect, computed, onUnmounted } from 'vue'
import { useWeeklyStore } from '@/stores/weekly'
import { getWeekDates } from '@/utils'

const route = useRoute()
const displayDate = ref<string | null>(null)
const { addSubscriber, removeSubscriber, getRecordsForWeek } = useWeeklyStore()

watchEffect(() => {
  removeSubscriber()
  const dateParam = route.params.date
  if (dateParam) {
    // 將參數值賦予給 displayDate
    displayDate.value = dateParam as string
    addSubscriber()
  } else {
    displayDate.value = null
  }
})

onUnmounted(() => {
  removeSubscriber()
})

const bubblePoints = computed(() => {
  const points: { x: string; y: number; r: number; ml: number }[] = []

  getWeekDates(true, displayDate.value).forEach((date) => {
    const record = getRecordsForWeek(displayDate.value)?.[date]
    const logs = record?.logs ?? {}

    // 如果沒有資料，仍保留一個隱形點（r=0）
    if (Object.keys(logs).length === 0) {
      points.push({ x: date, y: 12, r: 0, ml: 0 })
    } else {
      for (const [timestampStr, mlRaw] of Object.entries(logs)) {
        const timestamp = Number(timestampStr)
        const ml = Number(mlRaw)
        if (!isNaN(timestamp) && !isNaN(ml)) {
          const hour = new Date(timestamp).getHours()
          const radius = Math.min(20, Math.ceil(ml / 30))
          points.push({ x: date, y: hour, r: radius, ml })
        }
      }
    }
  })
  return points
})
</script>
