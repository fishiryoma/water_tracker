<template>
  <div class="h-[400px] w-full">
    <Bubble :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  TimeScale,
} from 'chart.js'
import { Bubble } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import 'chartjs-adapter-date-fns'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(Title, Tooltip, Legend, PointElement, LinearScale, TimeScale, annotationPlugin)

const props = defineProps<{
  bubblePoints: { x: string; y: number; r: number; ml: number }[]
}>()

const chartData = computed<ChartData<'bubble'>>(() => {
  return {
    datasets: [
      {
        data: props.bubblePoints as any,
        backgroundColor: (ctx) => {
          const chart = ctx.chart
          const { ctx: canvasCtx } = chart
          const gradient = canvasCtx.createLinearGradient(0, 0, 0, chart.height)
          gradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)')
          gradient.addColorStop(1, 'rgba(30, 64, 175, 0.8)')
          return gradient
        },
        hoverBackgroundColor: 'rgba(56, 189, 248, 0.8)',
      },
    ],
  }
})

watch(chartData, (newVal, oldVal) => {
  console.log(newVal, 'ttt')
})

const chartOptions: ChartOptions<'bubble'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        tooltipFormat: 'MM/dd',
        displayFormats: {
          day: 'MM/dd',
        },
      },
      title: { display: true, text: '本週日期' },
      grid: { color: '#eee' },
    },
    y: {
      title: { display: true, text: '喝水時間' },
      min: 0,
      max: 23,
      reverse: true,
      ticks: {
        stepSize: 1,
      },
      grid: {
        color: '#eee',
      },
    },
  },
  plugins: {
    annotation: {
      annotations: {
        noonLine: {
          type: 'line',
          yMin: 12,
          yMax: 12,
          borderColor: 'rgba(13, 148, 136, 0.4)',
          borderWidth: 2,
          borderDash: [6, 6],
          label: {
            display: true,
            content: '中午',
            position: 'start',
            backgroundColor: 'transparent',
            color: '#475569',

          },
        },
      },
    },
    tooltip: {
      displayColors: false,
      backgroundColor: 'rgba(13, 148, 136, 0.7)',
      callbacks: {
        label: (ctx) => {
          const { ml } = ctx.raw as any
          return `${ml} ml`
        },
      },
    },
    legend: { display: false },
  },
}
</script>
