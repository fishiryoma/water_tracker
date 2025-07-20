<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { onMounted, onUnmounted, watch } from 'vue'
import BackgroundContainer from '@/views/BackgroundContainer.vue'
import Container from '@/views/Container.vue'
import liff from '@line/liff'

import { useRouter } from 'vue-router'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'
import { auth } from '@/firebase' // 導入 Firebase Auth 實例
import { signOut } from 'firebase/auth' // <-- 這裡新增導入 signOut

import { useTheme } from '@/hooks/useTheme'

const router = useRouter()
const { setUserId } = useUserIdStore()
const { userId } = storeToRefs(useUserIdStore())
const weatherStore = useWeatherStore()
const { weather } = storeToRefs(weatherStore)
const { currentTheme } = useTheme()

// 在應用程式初始化時獲取天氣資料
onMounted(() => {
  weatherStore.fetchWeather()
})
const timer = setInterval(
  () => {
    if (!weatherStore.isFresh) {
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
  } catch (error) {
    console.error('登出失敗:', error)
  }
}

watch(weather.value, () => {
  console.log(weather.value.weathercode)
  if (weather.value.weathercode === 0 || weather.value.weathercode === 1) {
    if (currentTheme.value !== 'sakura') {
      currentTheme.value = 'sakura'
    }
  } else {
    if (currentTheme.value !== 'rain') {
      currentTheme.value = 'rain'
    }
  }
})

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
    <div class="flex justify-between mt-4 max-w-[500px] mx-auto" v-if="userId.length > 0">
    <!-- <div class="flex justify-between mt-4 max-w-[500px] mx-auto"> -->
      <div class="flex gap-4">
        <RouterLink to="/target">
          <img src="@/assets/target.svg" class="w-14" />
        </RouterLink>
        <RouterLink to="/tracker">
          <img src="@/assets/drink.svg" class="w-14" />
        </RouterLink>
      </div>
      <div>
        <div
        @click="handleLogout"
        class="flex flex-col items-center justify-center bg-green-600 text-white rounded-full px-4 py-2 hover:opacity-80 cursor-pointer duration-200"
      >
        <img class="w-7 stroke-orange-50" src="@/assets/door.svg" />
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
