<template>
  <div class="w-42 h-42 relative flex items-center justify-center" ref="rootEl">
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

        <!-- 動態水位裁切 -->
        <clipPath id="waterWaveClip">
          <path ref="waterClipPathRef" :d="surfacePath" />
        </clipPath>

        <!-- 圓形裁切（限制在圓環內） -->
        <clipPath id="circleClip">
          <circle cx="50" cy="50" r="47.3" />
        </clipPath>
      </defs>
      <!-- 水位動畫層 -->
      <g clip-path="url(#circleClip)">
        <!-- 基礎水層（以動態波浪裁切） -->
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="url(#waterGradient)"
          clip-path="url(#waterWaveClip)"
        />

        <!-- 波紋層1 -->
        <path
          ref="wave1Ref"
          :d="wave1Path"
          fill="url(#waveGradient)"
          clip-path="url(#waterWaveClip)"
        />

        <!-- 波紋層2 -->
        <path
          ref="wave2Ref"
          :d="wave2Path"
          fill="url(#waveGradient)"
          clip-path="url(#waterWaveClip)"
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
          clip-path="url(#waterWaveClip)"
        />
      </g>
      <!-- 背景軌道 -->
      <circle cx="50" cy="50" r="45" :stroke="progressStroke" stroke-width="5" fill="none" />

      <!-- 動態進度圓(隱藏中) -->
      <!-- <circle
        ref="progressCircleRef"
        cx="50"
        cy="50"
        r="45"
        stroke-width="6"
        :stroke="progressStroke"
        fill="none"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference"
        transform="rotate(-90 50 50)"
      /> -->
    </svg>
    <slot name="center">
      <!-- 百分比文字 -->
    </slot>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick, ref, computed, onMounted, defineExpose } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  percentage: {
    type: Number,
    default: 0,
  },
})

const rootEl = ref<HTMLDivElement | null>(null)

const progressCircleRef = ref<SVGCircleElement | null>(null)
// const waterRef = ref<SVGRectElement | null>(null)
const waterClipPathRef = ref<SVGPathElement | null>(null)
const wave1Ref = ref<SVGPathElement | null>(null)
const wave2Ref = ref<SVGPathElement | null>(null)
const highlightRef = ref<SVGEllipseElement | null>(null)

// 波紋動畫參數
const waveOffset1 = ref(0)
const waveOffset2 = ref(0)
const currentWaterLevel = ref(0)

// 波紋振幅（可動，便於製造「先大後小、趨於平靜」的效果）
const BASE_WAVE_AMP1 = 2.5
const BASE_WAVE_AMP2 = 1
const waveAmp1 = ref(BASE_WAVE_AMP1)
const waveAmp2 = ref(BASE_WAVE_AMP2)

// 依據 currentWaterLevel 同步更新裁切矩形（水位）
const updateClip = () => {
  // if (waterRef.value) {
  //   const y = 100 - currentWaterLevel.value
  //   waterRef.value.setAttribute('y', String(y))
  //   waterRef.value.setAttribute('height', String(currentWaterLevel.value))
  // }
  if (waterClipPathRef.value) {
    waterClipPathRef.value.setAttribute('d', surfacePath.value)
  }
}

// 觸發波浪激烈->平靜的振幅變化
const exciteWaves = (intensity = 1) => {
  const start1 = BASE_WAVE_AMP1 * 5 * intensity
  const start2 = BASE_WAVE_AMP2 * 5 * intensity
  gsap.killTweensOf([waveAmp1, waveAmp2])
  gsap.set(waveAmp1, { value: start1 })
  gsap.set(waveAmp2, { value: start2 })
  gsap.to(waveAmp1, { value: BASE_WAVE_AMP1, duration: 2, ease: 'power3.out' })
  gsap.to(waveAmp2, { value: BASE_WAVE_AMP2, duration: 2.2, ease: 'power3.out' })
}

const radius = 45
const circumference = 2 * Math.PI * radius
// 供所有進度圈共享的 dashoffset
const progressDashoffset = ref(circumference)

const progressStroke = computed(() => {
  const hue = 215 - (props.percentage / 100) * 15
  const saturation = 85 - (props.percentage / 100) * 10
  const light = 85 - (props.percentage / 100) * 20
  const alpha = 0.8 - (props.percentage / 100) * 0.4
  return `hsla(${hue}, ${saturation}%, ${light}%, ${alpha})`
})

// 生成波紋路徑（用於波紋層填充）
const generateWavePath = (offset: number, amplitude: number, frequency: number) => {
  const points: string[] = []
  const waterY = 100 - currentWaterLevel.value

  points.push(`M 0 ${waterY}`)
  for (let x = 0; x <= 100; x += 2) {
    const y = waterY + Math.sin((x + offset) * frequency * Math.PI) * amplitude
    points.push(`L ${x} ${y}`)
  }
  points.push(`L 100 100`)
  points.push(`L 0 100`)
  points.push(`Z`)
  return points.join(' ')
}

// 生成水面裁切路徑（讓整片水層也有起伏）
const generateSurfaceClipPath = (offset: number) => {
  const points: string[] = []
  const waterY = 100 - currentWaterLevel.value

  // 合成兩層波，振幅更有層次
  const ampA = waveAmp1.value
  const ampB = waveAmp2.value * 0.8
  const freqA = 0.03
  const freqB = 0.02

  points.push(`M 0 ${waterY}`)
  for (let x = 0; x <= 100; x += 2) {
    const y =
      waterY +
      Math.sin((x + offset) * freqA * Math.PI) * ampA +
      Math.sin((x - offset * 0.6) * freqB * Math.PI) * ampB
    points.push(`L ${x} ${y}`)
  }
  points.push(`L 100 100`)
  points.push(`L 0 100`)
  points.push(`Z`)
  return points.join(' ')
}

const surfacePath = computed(() => generateSurfaceClipPath(waveOffset1.value))

// 計算波紋路徑（振幅來自可動的 waveAmp1/2）
const wave1Path = computed(() => generateWavePath(waveOffset1.value, waveAmp1.value, 0.03))
const wave2Path = computed(() => generateWavePath(waveOffset2.value, waveAmp2.value, 0.025))

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
    // 水全滿時讓動畫跑慢一點
    const dynamicDuration = clamped === 100 ? 5 : 2

    // 統一更新 dashoffset，讓所有進度圈同步
    progressDashoffset.value = offset

    if (progressCircleRef.value) {
      gsap.to(progressCircleRef.value, {
        attr: { 'stroke-dashoffset': offset },
        duration: dynamicDuration,
        ease: 'power2.out',
      })
    }

    // const y = 100 - clamped
    // const height = clamped

    // 也同步更新一次裁切矩形（保守起見，避免初始抖動）
    // if (waterRef.value) {
    //   gsap.to(waterRef.value, {
    //     attr: { y, height },
    //     duration: dynamicDuration,
    //     ease: 'power2.out',
    //     onUpdate: updateClip,
    //   })
    // }

    // 內部水位數值，供波形計算使用（同步和裁切矩形）
    gsap.to(currentWaterLevel, {
      value: clamped,
      duration: dynamicDuration,
      ease: 'power2.out',
      onUpdate: updateClip,
    })

    // 每次進度改變時，讓波浪先大幅起伏再趨於平靜
    const delta = Math.abs(clamped - currentWaterLevel.value)
    const intensity = Math.min(1.5, 0.5 + (delta / 100) * 1.2)
    exciteWaves(intensity)
  },
  { immediate: true }
)

defineExpose({ rootEl, exciteWaves })

onMounted(async () => {
  await nextTick()
  startWaveAnimation()
})
</script>
