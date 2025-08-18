<template>
  <p class="mt-4 text-primary-800">本周喝水達標表</p>
  <div ref="gridRef" class="grid grid-cols-7 border-2 border-primary-800/50 rounded-lg px-3">
    <ClenderDay v-for="day in weekdayTw" :key="day" className="border-b-2 border-primary-800/50">
      {{ day }}
    </ClenderDay>
    <ClenderDay v-for="[date, data] in renderedIcon" :key="date" className="py-3" :data-date="date">
      <template v-if="data.status === 'future'">
        <MinusIcon class="text-primary-800 size-4" data-week-icon />
      </template>
      <template v-else-if="data.finished">
        <img src="@/assets/ok.svg" class="size-6" data-week-icon />
      </template>
      <template v-else-if="data.finished === false && data.status === 'pass'">
        <img src="@/assets/fail.svg" class="size-4" data-week-icon />
      </template>
      <template v-else> <StarIcon class="text-amber-300 size-6" data-week-icon /> </template>
    </ClenderDay>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import ClenderDay from './ClenderDay.vue'
import { MinusIcon } from '@heroicons/vue/24/outline'
import { StarIcon } from '@heroicons/vue/24/solid'
import { gsap } from 'gsap'

const weekdayTw = ['日', '一', '二', '三', '四', '五', '六']

const props = defineProps<{ weeklyDrank: Record<string, { finished: boolean; status: string }> }>()
const gridRef = ref<HTMLDivElement | null>(null)

const renderedIcon = computed(() => {
  const entries = Object.entries(props.weeklyDrank)
  const missing = 7 - entries.length
  for (let i = 0; i < missing; i++) {
    entries.push([`dummy${i}`, { finished: null, status: 'future' }])
  }
  return entries
})

const todayIsFinished = computed(() => {
  const entry = Object.values(props.weeklyDrank).find((it) => it.status === 'today')
  return !!entry?.finished
})

const todayDateKey = computed(() => {
  const entries = Object.entries(props.weeklyDrank)
  return entries.find((item) => item[1].status === 'today')?.[0]
})

watch(todayDateKey, () => {
  if (gridRef.value) {
    const todayElement = gridRef.value.querySelector(`[data-date="${todayDateKey.value}"]`)
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth' })
    }
  }
})

const bloomBurst = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const w = rect.width
  const h = rect.height

  const bloom = document.createElement('div')
  bloom.style.cssText = `
      position:fixed; left:${cx}px; top:${cy}px; transform: translate(-50%, -50%);
      width:${w}px; height:${h}px; border-radius:50%;
      background: radial-gradient(closest-side, rgba(255,215,0,0.6), rgba(255,215,0,0) 70%);
      pointer-events:none; opacity:0; mix-blend-mode:screen; filter: blur(1px); z-index:9999;
    `
  document.body.appendChild(bloom)

  const ring = document.createElement('div')
  ring.style.cssText = `
      position: fixed; left:${cx}px; top:${cy}px; transform: translate(-50%, -50%);
      width:${w}px; height:${h}px; border-radius:50%;
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6) inset;
      pointer-events:none; opacity:0; z-index: 9999;
    `
  document.body.appendChild(ring)

  const tl = gsap.timeline({
    onComplete: () => {
      bloom.remove()
      ring.remove()
    },
  })

  tl.to(bloom, { opacity: 1, duration: 0.12, ease: 'power2.out' })
    .to(bloom, { opacity: 0, duration: 0.45, ease: 'power3.out' }, '>-0.02')
    .to(ring, { opacity: 1, duration: 0.4, ease: 'power2.out' }, '<')
    .to(ring, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '<0.15')
  return tl
}

const glint = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const size = Math.max(rect.width, rect.height)

  const streak = document.createElement('div')
  streak.style.cssText = `
      position: fixed; left:${cx}px; top:${cy}px; transform: translate(-50%, -50%) translateX(-100%);
      width:${size}px; height:${size}px; border-radius: 50%;
      background: radial-gradient(ellipse 60% 100%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0) 100%);
      mix-blend-mode: screen; pointer-events:none; opacity:0; z-index:9999; will-change: transform, opacity;
      filter: blur(1px);
    `
  document.body.appendChild(streak)

  const tl = gsap.timeline({
    onComplete: () => streak.remove(),
  })

  tl.to(streak, { opacity: 1, duration: 0.08, ease: 'power2.out' })
    .to(streak, { x: size * 0.5 , duration: 0.5, ease: 'power2.inOut' }, '<')
    .to(streak, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '<0.3')
  return tl
}

const emphasizeLux = (iconEl: HTMLElement) => {
  gsap.killTweensOf(iconEl)
  const tl = gsap.timeline()
  // 1) 先放大
  tl.fromTo(
    iconEl,
    { scale: 0.6, rotate: -6, autoAlpha: 0, transformOrigin: '50% 50%' },
    { scale: 2.5, rotate: 0, autoAlpha: 1, duration: 0.28, ease: 'back.out(2)' },
  )
  // 2) 放大完成後，用 onComplete 確保時序
  tl.call(
    () => {
      let effectsCompleted = 0
      const totalEffects = 2

      const checkComplete = () => {
        effectsCompleted++
        if (effectsCompleted === totalEffects) {
          // 所有特效完成，開始縮回
          gsap.to(iconEl, { scale: 1, duration: 0.22, ease: 'power2.out' })
        }
      }

      // 啟動 bloom
      const bloomTl = bloomBurst(iconEl)
      bloomTl.eventCallback('onComplete', checkComplete)

      // 延遲 0.06 秒啟動 glint
      gsap.delayedCall(0.06, () => {
        const glintTl = glint(iconEl)
        glintTl.eventCallback('onComplete', checkComplete)
      })
    },
    null,
    '>',
  )
  return tl
}

watch(todayIsFinished, async (newVal, prevVal) => {
  if (newVal && !prevVal) {
    await nextTick()
    const date = todayDateKey.value
    if (!date) return
    const iconEl = gridRef.value?.querySelector(
      `[data-date="${date}"] [data-week-icon]`,
    ) as HTMLElement | null
    if (iconEl) {
      emphasizeLux(iconEl)
    }
  }
})
</script>
