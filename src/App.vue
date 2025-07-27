<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { onUnmounted } from 'vue'
import BackgroundContainer from '@/views/BackgroundContainer.vue'
import Container from '@/views/Container.vue'
import liff from '@line/liff'

import { useRouter } from 'vue-router'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'
import { auth } from '@/firebase' // 導入 Firebase Auth 實例
import { signOut } from 'firebase/auth' // <-- 這裡新增導入 signOut

const router = useRouter()
const { setUserId } = useUserIdStore()
const { userId } = storeToRefs(useUserIdStore())
const weatherStore = useWeatherStore()

// 在應用程式初始化時獲取天氣資料
weatherStore.fetchWeather()

// 定時檢查天氣資料是否需要更新
const timer = setInterval(
  () => {
    if (!weatherStore.isFresh) {
      weatherStore.fetchWeather()
    }
  },
  60 * 60 * 1000, // 每小時檢查一次
)

const handleLogout = async (): Promise<void> => {
  try {
    await signOut(auth)
    setUserId('')
    if (liff.isLoggedIn()) {
      liff.logout() // 呼叫 LIFF 的登出方法
    }
    router.push('/')
  } catch (error) {
    console.error('登出失敗:', error)
  }
}

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <BackgroundContainer>
    <img
      src="./assets/bottom-fotor-bg-remover.png"
      class="sm:w-[100px] w-[75px] mx-auto mt-4 rounded-full bg-amber-100/50"
    />
    <Container>
      <RouterView />
    </Container>
    <div
      class="flex justify-between mt-4 max-w-[640px] mx-3 sm:mx-auto mb-3 sm:mb-6"
      v-if="userId.length > 0"
    >
      <!-- <div class="flex justify-between mt-4 max-w-[640px] mx-3 sm:mx-auto mb-3 sm:mb-6"> -->
      <div class="flex gap-4">
        <RouterLink to="/target">
          <img src="@/assets/target.svg" class="sm:w-14 w-10" />
        </RouterLink>
        <RouterLink to="/tracker">
          <img src="@/assets/drink.svg" class="sm:w-14 w-10" />
        </RouterLink>
      </div>
      <div>
        <div
          @click="handleLogout"
          class="flex flex-col items-center justify-center bg-amber-400 text-white rounded-full p-1 sm:p-2 hover:opacity-80 cursor-pointer duration-200"
        >
          <img class="w-7" src="@/assets/door.svg" />
        </div>
      </div>
    </div>
  </BackgroundContainer>
</template>

<style>
#app {
  font-family: 'Huninn', sans-serif;
  font-weight: 400;
  font-style: normal;
}
</style>
