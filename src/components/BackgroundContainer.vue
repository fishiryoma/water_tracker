<template>
  <div ref="bgContainer" class="relative bg-primary-200/50 overflow-hidden h-screen">
    <!-- 天氣載入狀態 -->
    <div
      v-if="weatherStore.weather.isLoading"
      class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/80 rounded-lg p-2 shadow-lg"
    >
      <LoadingSpinner :show="true" :message="t('LOADING.WEATHER')" />
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, watch, nextTick } from 'vue'
import { useTheme } from '@/hooks/useTheme'
import { useWeatherStore } from '@/stores/weather'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { gsap } from 'gsap'

const bgContainer = ref<HTMLElement | null>(null)
const { currentTheme } = useTheme()
const weatherStore = useWeatherStore()

let spawnTl: gsap.core.Timeline | null = null
let ctx: gsap.Context | null = null

// 監聽主題變化，更新所有飄落元素的樣式
watch(currentTheme, (newTheme) => {
  if (bgContainer.value) {
    const fallingElements = bgContainer.value.querySelectorAll('.sakura, .rain')
    fallingElements.forEach((element) => {
      element.classList.remove('sakura', 'rain')
      element.classList.add(newTheme)
    })
  }
})

onMounted(async () => {
  await nextTick()
  ctx = gsap.context(() => {
    const host = bgContainer.value ?? document.body

    const spawnOne = () => {
      const el = document.createElement('div')
      el.classList.add(currentTheme.value)
      el.style.position = 'absolute'
      el.style.top = '-80px'
      el.style.pointerEvents = 'none'
      el.style.willChange = 'transform'
      const rect = host.getBoundingClientRect()
      const left = Math.random() * rect.width
      el.style.left = `${left}px`
      const baseOpacity = gsap.utils.random(0.6, 1)
      el.style.opacity = String(baseOpacity)
      host.appendChild(el)

      // 依主題調整參數
      const isRain = currentTheme.value === 'rain'
      const duration = isRain ? gsap.utils.random(4.5, 7) : gsap.utils.random(7, 12)
      const drift = isRain ? gsap.utils.random(-40, 40) : gsap.utils.random(-160, 160)
      const rot = isRain ? gsap.utils.random(-20, 20) : gsap.utils.random(-180, 180)
      const swayDur = isRain ? gsap.utils.random(1.2, 1.8) : gsap.utils.random(1.6, 2.4)
      const swayAmp = isRain ? gsap.utils.random(6, 16) : gsap.utils.random(12, 28)
      const fallEase = isRain ? 'elastic.out(0.5, 0.5)' : 'power1.out'

      // 主要下落 tween
      const fall = gsap.to(el, {
        y: rect.height + 140,
        x: `+=${drift}`,
        rotation: rot,
        duration,
        ease: fallEase,
        onComplete: () => {
          gsap.killTweensOf(el)
          el.remove()
        },
      })

      // 水平擺動（相對 x）
      gsap.to(el, {
        x: `+=${swayAmp}`,
        duration: swayDur,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: Math.ceil(duration / swayDur),
      })

      return fall
    }

    // 生成時間軸（可依主題/天氣調整密度）
    const spawnRate = 0.3 // 秒
    spawnTl = gsap.timeline({ repeat: -1 })
    spawnTl
      .call(
        () => {
          // 每個tick生成 1~2 個
          const count = gsap.utils.random(1, 2, 1)
          for (let i = 0; i < count; i++) spawnOne()
        },
        undefined,
        0,
      )
      .to({}, { duration: spawnRate })
  })
})

onBeforeUnmount(() => {
  if (spawnTl) spawnTl.kill()
  if (ctx) ctx.revert()
})
</script>

<style>
/* 飄落元素樣式（由 GSAP 控制，不再使用 CSS keyframes） */
.sakura,
.rain {
  position: absolute;
  top: -50px;
  pointer-events: none;
  z-index: 0;
  background-size: contain;
  background-repeat: no-repeat;
  will-change: transform;
}
.sakura {
  width: 36px;
  height: 36px;
  background-image: url('../assets/petal.png');
}
.rain {
  width: 60px;
  height: 60px;
  background-image: url('../assets/raindrop2.png');
}
</style>
