<template>
  <div ref="bgContainer" class="relative bg-primary-200/50 overflow-hidden h-screen">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, watch } from 'vue'
import { useTheme } from '@/hooks/useTheme'
import { storeToRefs } from 'pinia'
import { useWeatherStore } from '@/stores/weather'

const bgContainer = ref<HTMLElement | null>(null)
let intervalId: NodeJS.Timeout | null = null
const { currentTheme } = useTheme()
const weatherStore = useWeatherStore()
const { weather } = storeToRefs(weatherStore)

// 監聽天氣變化，自動設定主題
watch(
  weather,
  (newWeather) => {
    if (newWeather.weathercode !== null) {
      // 根據天氣代碼設定主題
      if (newWeather.weathercode === 0 || newWeather.weathercode === 1) {
        // 晴朗天氣 → 櫻花主題
        if (currentTheme.value !== 'sakura') {
          currentTheme.value = 'sakura'
        }
      } else {
        // 其他天氣 → 雨天主題
        if (currentTheme.value !== 'rain') {
          currentTheme.value = 'rain'
        }
      }
    }
  },
  { deep: true },
)

// 監聽主題變化，更新所有飄落元素的樣式
watch(
  currentTheme,
  (newTheme, oldTheme) => {
    if (bgContainer.value && oldTheme) {
      const fallingElements = bgContainer.value.querySelectorAll('.sakura, .rain')
      fallingElements.forEach((element) => {
        element.classList.remove(oldTheme)
        element.classList.add(newTheme)
      })
    }
  },
  { immediate: false },
)

onMounted(() => {
  // upgrade: 增加花瓣類型, 飄動軌跡更自然

  function createPetal() {
    const fallingComponent = document.createElement('div')
    fallingComponent.classList.add(currentTheme.value)

    if (bgContainer.value) {
      fallingComponent.style.left = Math.random() * bgContainer.value.offsetWidth + 'px'
    } else {
      fallingComponent.style.left = Math.random() * window.innerWidth + 'px'
    }
    fallingComponent.style.animationDuration = 5 + Math.random() * 5 + 's'
    fallingComponent.style.opacity = Math.random().toString()

    if (bgContainer.value) {
      bgContainer.value.appendChild(fallingComponent)
    }

    setTimeout(() => {
      fallingComponent.remove()
    }, 10000)
  }

  intervalId = setInterval(() => {
    createPetal()
  }, 300)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style>
/* 飄落元素樣式 */
.sakura {
  position: absolute;
  top: -50px;
  width: 36px;
  height: 36px;
  background-image: url('../assets/petal.png');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  animation: sakuraFall linear infinite;
  z-index: 0;
}

.rain {
  position: absolute;
  top: -50px;
  width: 60px;
  height: 60px;
  background-image: url('../assets/raindrop2.png');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  animation: rainFall linear infinite;
  z-index: 0;
}

@keyframes sakuraFall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0.2;
  }
}

@keyframes rainFall {
  0% {
    transform: translateY(0) rotate(15deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0.2;
  }
}
</style>
