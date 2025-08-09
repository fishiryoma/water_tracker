<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onUnmounted } from 'vue'
import BackgroundContainer from '@/views/BackgroundContainer.vue'
import Container from '@/views/Container.vue'
import GlobalErrorHandler from '@/components/GlobalErrorHandler.vue'
import MenuBtn from '@/components/MenuBtn.vue'
import liff from '@line/liff'

import { useRouter } from 'vue-router'
import { useUserIdStore } from '@/stores/userId'
// import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'
import { useGlobalErrorStore } from '@/stores/globalError'
import { auth } from '@/firebase' // 導入 Firebase Auth 實例
import { signOut } from 'firebase/auth' // <-- 這裡新增導入 signOut

const router = useRouter()
const { setUserId } = useUserIdStore()
// const { userId } = storeToRefs(useUserIdStore())
const weatherStore = useWeatherStore()
const errorStore = useGlobalErrorStore()

// 在應用程式初始化時獲取天氣資料
// 先嘗試載入緩存的天氣資料，如果沒有則獲取新資料
weatherStore.loadCachedWeather()
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
    errorStore.showError('登出失敗', '請重新嘗試登出操作')
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
    <!-- 測試用 -->
    <MenuBtn :handleLogout="handleLogout" />
    <!-- <MenuBtn :handleLogout="handleLogout" v-if="userId.length > 0"/> -->
  </BackgroundContainer>

  <!-- 全局錯誤處理器 -->
  <GlobalErrorHandler />
</template>

<style>
#app {
  font-family: 'Huninn', sans-serif;
  font-weight: 400;
  font-style: normal;
}
</style>
