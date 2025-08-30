<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onUnmounted, computed, watch } from 'vue'
import BackgroundContainer from '@/components/BackgroundContainer.vue'
import Container from '@/components/Container.vue'
import GlobalErrorHandler from '@/components/GlobalErrorHandler.vue'
import MenuBtn from '@/components/MenuBtn.vue'

import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'
import { useI18n } from 'vue-i18n'
import logoJp from '@/assets/logo_Jp_s.png'
import logoTw from '@/assets/logo_Tw_s.png'
import logoEn from '@/assets/logo_En_s.png'

const { t, locale } = useI18n()

const { userId } = storeToRefs(useUserIdStore())
const weatherStore = useWeatherStore()

// 在應用程式初始化時獲取天氣資料
// 先嘗試載入緩存的天氣資料，如果沒有則獲取新資料
weatherStore.loadCachedWeather()
weatherStore.fetchWeather()

const logoSrc = computed(() => {
  if (locale.value === 'ja') return logoJp
  else if (locale.value === 'en') return logoEn
  else return logoTw
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

watch(
  locale,
  (newLocale) => {
    // 將 html 的 lang 屬性設定為新的語系
    document.documentElement.lang = newLocale
    document.title = t('TITLE.APP_NAME')
  },
  { immediate: true },
)
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
          :class="[
            'cursor-pointer rounded-xl px-1.5 py-1 duration-200 text-xs',
            lang.key === locale
              ? 'bg-gray-500/80 text-white'
              : 'bg-white/70 text-stone-600 hover:bg-gray-200',
          ]"
        >
          {{ lang.value }}
        </div>
      </div>
      <RouterView />
    </Container>
    <!-- 測試用 -->
    <!-- <MenuBtn :handleLogout="handleLogout" /> -->
    <MenuBtn v-if="userId.length > 0" />
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
