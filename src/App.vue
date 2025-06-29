<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
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
const { weather } = storeToRefs(weatherStore)

// 在應用程式初始化時獲取天氣資料
onMounted(() => {
  weatherStore.fetchWeather()
})
console.log(weather.value)
const timer = setInterval(
  () => {
    if (!weatherStore.isFresh.value) {
      weatherStore.fetchWeather()
    }
  },
  60 * 60 * 1000,
)

const handleLogout = async (): Promise<void> => {
  try {
    await signOut(auth)
    setUserId('')
    if (liff.isLoggedIn()) {
      liff.logout() // 呼叫 LIFF 的登出方法
    }
    router.push('/')
  } catch (error: Error) {
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
      class="w-[100px] mx-auto mt-4 rounded-full bg-amber-100/50"
    />
    <Container>
      <RouterView />
    </Container>
    <div class="relative" v-if="userId.length > 0">
      <div
        @click="handleLogout"
        class="flex flex-col items-center justify-center bg-green-600 text-white rounded-full px-4 py-2 absolute -bottom-12 right-1/2 transform translate-x-[180px] sm:translate-x-[200px] hover:opacity-80 cursor-pointer duration-200"
      >
        <img class="w-7 stroke-orange-50" src="@/assets/door.svg" />
      </div>
      <div
        class="absolute -bottom-12 left-1/2 transform -translate-x-[170px] sm:-translate-x-[200px] cursor-pointer"
      >
        <RouterLink to="/target">
          <img src="@/assets/target.svg" class="w-14" />
        </RouterLink>
      </div>
      <div
        class="absolute -bottom-12 left-1/2 transform -translate-x-[90px] sm:-translate-x-[120px] cursor-pointer"
      >
        <RouterLink to="/tracker">
          <img src="@/assets/drink.svg" class="w-14" />
        </RouterLink>
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
