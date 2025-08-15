<template>
  <p class="mt-4 text-primary-800">本周喝水達標表</p>
  <div class="grid grid-cols-7 border-2 border-primary-800/50 rounded-lg px-3">
    <ClenderDay v-for="day in weekdayTw" :key="day" className="border-b-2 border-primary-800/50">
      {{ day }}
    </ClenderDay>
    <ClenderDay v-for="(data, index) in Object.values(renderedIcon)" :key="index" className="py-3">
      <template v-if="data.status === 'future'"> <MinusIcon class="text-primary-800 size-6" /> </template>
      <template v-else-if="data.finished">
        <FaceSmileIcon class="text-sky-800 size-6 stroke-2" />
      </template>
      <template v-else-if="data.finished === false && data.status === 'pass'">
        <FaceFrownIcon class="text-primary-800 size-6" />
      </template>
      <template v-else> <StarIcon class="text-amber-300 size-6" /> </template>
    </ClenderDay>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClenderDay from './ClenderDay.vue'
import { FaceFrownIcon } from '@heroicons/vue/24/outline'
import { FaceSmileIcon } from '@heroicons/vue/24/outline'
import { MinusIcon } from '@heroicons/vue/24/outline'
import { StarIcon } from '@heroicons/vue/24/solid'

const weekdayTw = ['日', '一', '二', '三', '四', '五', '六']

const props = defineProps<{ weeklyDrank: Record<string, { finished: boolean; status: string }> }>()

const renderedIcon = computed(() => {
  const iconsLength = Object.values(props.weeklyDrank).length
  const newWeeklyDrank = { ...props.weeklyDrank }
  for (let i = 0; i < 7 - iconsLength; i++) {
    newWeeklyDrank[`dummy${i}`] = { finished: null, status: 'future' }
  }
  return newWeeklyDrank
})
</script>
