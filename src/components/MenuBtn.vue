<template>
  <div
    class="flex justify-between max-w-[640px] mx-3 sm:mx-auto bg-primary-200/60 rounded-lg pl-2"
  >
    <div class="flex gap-2 sm:gap-4">
      <RouterLink v-for="item in menu" :key="item.url" :to="item.url">
        <div class="flex flex-col items-center justify-center text-primary-700 p-1 sm:p-2 hover:opacity-80 cursor-pointer duration-200">
          <component :is="item.icon" class="sm:w-8 w-6" />
          <p class="text-xs sm:text-sm">{{ item.text }}</p>
        </div>
      </RouterLink>
    </div>
    <div>
      <div
        @click="props.handleLogout"
        class="flex flex-col items-center justify-center rounded-r-lg bg-primary-300/70 text-gray-600 px-4 sm:px-6 py-1 sm:py-2 hover:opacity-80 cursor-pointer duration-200"
      >
        <ArrowTopRightOnSquareIcon class="sm:w-8 w-6" />
        <p class="text-xs sm:text-sm">登出</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { type PropType } from 'vue'
import { ChartBarSquareIcon } from '@heroicons/vue/24/outline'
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/outline'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  handleLogout: {
    type: Function as PropType<() => Promise<void>>,
    required: true,
  },
})

const menu = [
  { url: '/target', icon: ChartBarSquareIcon, text: '更改目標' },
  { url: '/tracker', icon: ChatBubbleOvalLeftIcon, text: '今日飲水量' },
]
</script>
