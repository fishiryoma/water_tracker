<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onUnmounted, computed } from 'vue'
import BackgroundContainer from '@/components/BackgroundContainer.vue'
import Container from '@/components/Container.vue'
import GlobalErrorHandler from '@/components/GlobalErrorHandler.vue'
import MenuBtn from '@/components/MenuBtn.vue'
import liff from '@line/liff'

import { useRouter } from 'vue-router'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'
import { useGlobalErrorStore } from '@/stores/globalError'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useI18n } from 'vue-i18n'
import logoJp from '@/assets/logo_Jp.png'
import logoT from '@/assets/logo_Tw.png'

const { t, locale } = useI18n()

const router = useRouter()
const { setUserId } = useUserIdStore()
const { userId } = storeToRefs(useUserIdStore())
const weatherStore = useWeatherStore()
const errorStore = useGlobalErrorStore()

// 在應用程式初始化時獲取天氣資料
// 先嘗試載入緩存的天氣資料，如果沒有則獲取新資料
weatherStore.loadCachedWeather()
weatherStore.fetchWeather()

const logoSrc = computed(() => {
  return locale.value === 'ja' ? logoJp : logoT
})

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
    errorStore.showError(t('ERROR.LOGOUT_FAILED_TITLE'), t('ERROR.LOGOUT_FAILED_DETAILS'))
  }
}

onUnmounted(() => {
  clearInterval(timer)
})

const lang = [
  { key: 'zh-TW', value: '中文' },
  { key: 'ja', value: '日本語' },
  { key: 'en', value: 'EN' },
]

const setLocale = (selectedLocale: string) => {
  locale.value = selectedLocale
  localStorage.setItem('user-locale', selectedLocale)
}
</script>

<template>
  <BackgroundContainer>
    <img :src="logoSrc" class="sm:w-[100px] w-[75px] mx-auto mt-4 rounded-full" />

    <Container>
      <div class="max-w-[640px] sm:mx-auto flex gap-1 justify-end absolute -top-7 right-0">
        <div
          v-for="lang in lang"
          :key="lang.key"
          @click="setLocale(lang.key)"
          class="cursor-pointer bg-white/70 rounded-xl px-1.5 py-1 hover:bg-gray-200 duration-200 text-stone-600 text-xs"
        >
          {{ lang.value }}
        </div>
      </div>
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
.shiny-text {
  text-shadow: 0 0 0 rgba(255, 255, 255, 1);
  animation: glow-pulse 2s infinite ease-in-out;
}

@keyframes glow-pulse {
  0%,
  100% {
    text-shadow: 0 0 0 rgba(255, 255, 255, 1);
  }
  50% {
    text-shadow:
      0 0 4px rgba(255, 255, 255, 0.9),
      0 0 8px rgba(255, 255, 255, 0.7),
      0 0 10px rgba(255, 255, 255, 0.5);
  }
}
</style>
