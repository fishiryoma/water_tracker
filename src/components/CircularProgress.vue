<template>
  <div class="w-40 h-40 relative flex items-center justify-center">
    <svg class="absolute inset-0" viewBox="0 0 100 100">
      <!-- 定義漸變和濾鏡 -->
      <defs>
        <!-- 水的漸變色 -->
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: hsl(200, 80%, 85%); stop-opacity: 0.8" />
          <stop offset="50%" style="stop-color: hsl(210, 75%, 75%); stop-opacity: 0.9" />
          <stop offset="100%" style="stop-color: hsl(220, 70%, 65%); stop-opacity: 1" />
        </linearGradient>

        <!-- 波紋漸變 -->
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: hsl(200, 90%, 90%); stop-opacity: 0.6" />
          <stop offset="100%" style="stop-color: hsl(210, 80%, 80%); stop-opacity: 0.3" />
        </linearGradient>

        <!-- 高光效果 -->
        <radialGradient id="highlight" cx="30%" cy="20%">
          <stop offset="0%" style="stop-color: white; stop-opacity: 0.4" />
          <stop offset="70%" style="stop-color: white; stop-opacity: 0.1" />
          <stop offset="100%" style="stop-color: white; stop-opacity: 0" />
        </radialGradient>

        <!-- 水位裁切路徑 -->
        <clipPath id="waterClip">
          <rect ref="waterRef" x="0" y="100" width="100" height="0" />
        </clipPath>

        <!-- 圓形裁切（限制在圓環內） -->
        <clipPath id="circleClip">
          <circle cx="50" cy="50" r="45" />
        </clipPath>
      </defs>
      <!-- 水位動畫層 -->
      <g clip-path="url(#circleClip)">
        <!-- 基礎水層 -->
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="url(#waterGradient)"
          clip-path="url(#waterClip)"
        />

        <!-- 波紋層1 -->
        <path ref="wave1Ref" :d="wave1Path" fill="url(#waveGradient)" clip-path="url(#waterClip)" />

        <!-- 波紋層2 -->
        <path
          ref="wave2Ref"
          :d="wave2Path"
          fill="url(#waveGradient)"
          clip-path="url(#waterClip)"
          opacity="0.7"
        />

        <!-- 高光層 -->
        <ellipse
          ref="highlightRef"
          cx="35"
          cy="30"
          rx="15"
          ry="8"
          fill="url(#highlight)"
          clip-path="url(#waterClip)"
        />
      </g>
      <!-- 水滴效果 -->
      <g ref="dropletsRef" opacity="0">
        <circle cx="25" cy="15" r="1" fill="hsl(210, 80%, 70%)" opacity="0.6" />
        <circle cx="75" cy="20" r="0.8" fill="hsl(210, 80%, 70%)" opacity="0.5" />
        <circle cx="60" cy="10" r="1.2" fill="hsl(210, 80%, 70%)" opacity="0.7" />
      </g>
      <!-- 背景軌道 -->
      <circle cx="50" cy="50" r="45" stroke="#e5e7eb" stroke-width="10" fill="none" />
      <!-- 動態進度圓 -->
      <circle
        ref="progressCircleRef"
        cx="50"
        cy="50"
        r="45"
        stroke-width="8"
        :stroke="progressStroke"
        fill="none"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <slot name="center">
      <!-- 百分比文字 -->
    </slot>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick, ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  percentage: {
    type: Number,
    default: 0,
  },
  todayDrank: {
    type: Number,
    default: 0,
  },
  dailyTarget: {
    type: Number,
    default: 0,
  },
})

const progressCircleRef = ref<SVGCircleElement | null>(null)
const waterRef = ref<SVGRectElement | null>(null)
const wave1Ref = ref<SVGPathElement | null>(null)
const wave2Ref = ref<SVGPathElement | null>(null)
const highlightRef = ref<SVGEllipseElement | null>(null)
const dropletsRef = ref<SVGGElement | null>(null)

// 波紋動畫參數
const waveOffset1 = ref(0)
const waveOffset2 = ref(0)
const currentWaterLevel = ref(0)

const radius = 45
const circumference = 2 * Math.PI * radius

const progressStroke = computed(() => {
  // hue 由 205（淺藍）到 215（深藍），亮度隨進度微降
  const hue = 210 - (props.percentage / 100) * 20
  const light = 82 - (props.percentage / 100) * 40
  return `hsl(${hue}, 90%, ${light}%)`
})

// 生成波紋路徑
const generateWavePath = (offset: number, amplitude: number = 2, frequency: number = 0.02) => {
  const points: string[] = []
  const waterY = 100 - currentWaterLevel.value

  // 起始點
  points.push(`M 0 ${waterY}`)

  // 生成波紋曲線
  for (let x = 0; x <= 100; x += 2) {
    const y = waterY + Math.sin((x + offset) * frequency * Math.PI) * amplitude
    points.push(`L ${x} ${y}`)
  }

  // 封閉路徑
  points.push(`L 100 100`)
  points.push(`L 0 100`)
  points.push(`Z`)

  return points.join(' ')
}

// 計算波紋路徑
const wave1Path = computed(() => generateWavePath(waveOffset1.value, 1.5, 0.03))
const wave2Path = computed(() => generateWavePath(waveOffset2.value, 1, 0.025))

// 啟動波紋動畫
const startWaveAnimation = () => {
  // 波紋1 - 較快的波動
  gsap.to(waveOffset1, {
    value: 200,
    duration: 8,
    ease: 'none',
    repeat: -1,
  })

  // 波紋2 - 較慢的波動
  gsap.to(waveOffset2, {
    value: -150,
    duration: 12,
    ease: 'none',
    repeat: -1,
  })
}

watch(
  () => props.percentage,
  async (newVal) => {
    await nextTick()

    const clamped = Math.max(0, Math.min(100, Number(newVal) || 0))
    const offset = circumference - (clamped / 100) * circumference

    if (progressCircleRef.value) {
      gsap.to(progressCircleRef.value, {
        attr: { 'stroke-dashoffset': offset },
        duration: 2,
        ease: 'power2.out',
      })
    }

    const y = 100 - clamped
    const height = clamped

    if (waterRef.value) {
      gsap.to(waterRef.value, {
        attr: { y, height },
        duration: 2,
        ease: 'power2.out',
      })
    }

    // 內部水位數值，供波形計算使用（同步和裁切矩形）
    gsap.to(currentWaterLevel, {
      value: clamped,
      duration: 2,
      ease: 'power2.out',
    })
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  startWaveAnimation()
})
</script>
