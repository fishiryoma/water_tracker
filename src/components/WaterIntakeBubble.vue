<template>
  <div class="h-[400px] w-full">
    <Chart type="bubble" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  TimeScale,
  BarElement,
} from 'chart.js'
import { Chart } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import 'chartjs-adapter-date-fns'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  TimeScale,
  annotationPlugin,
  BarElement,
)

const props = defineProps<{
  bubblePoints: { x: string; y: number; r: number; ml: number }[]
}>()

// 螢幕寬度>300px時，增加喝水總量bar
const showBarChart = ref(window.innerWidth > 300)
const handleResize = () => {
  showBarChart.value = window.innerWidth > 300
}
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const dailyTotals = computed(() => {
  const totals: { [key: string]: number } = {}
  props.bubblePoints.forEach((item) => {
    if (!totals[item.x]) {
      totals[item.x] = 0
    }
    totals[item.x] += item.ml
  })
  return Object.keys(totals).map((date) => ({ x: date, y: totals[date] }))
})

const chartData = computed<ChartData<'bubble' | 'bar'>>(() => {
  const bubbleDataset = {
    type: 'bubble' as const,
    label: '單次飲水',
    data: props.bubblePoints as any,
    backgroundColor: (ctx: any) => {
      const chart = ctx.chart
      const { ctx: canvasCtx } = chart
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, chart.height)
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)')
      gradient.addColorStop(1, 'rgba(30, 64, 175, 0.8)')
      return gradient
    },
    hoverBackgroundColor: 'rgba(56, 189, 248, 0.8)',
    yAxisID: 'y',
  }

  const barDataset = {
    type: 'bar' as const,
    label: '每日總量',
    data: dailyTotals.value,
    backgroundColor: 'rgba(13, 148, 136, 0.4)',
    yAxisID: 'y1',
    borderRadius: 8,
  }

  const datasets: any[] = [bubbleDataset]
  if (showBarChart.value) {
    datasets.push(barDataset)
  }

  return {
    datasets,
  }
})

const chartOptions = computed<ChartOptions<'bubble' | 'bar'>>(() => {
  const options: ChartOptions<'bubble' | 'bar'> = {
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
        backgroundColor: 'rgba(13, 148, 136, 0.8)',
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.type === 'bubble') {
              const { ml } = ctx.raw as any
              return `${ml} mL`
            }
            if (ctx.dataset.type === 'bar') {
              const { y } = ctx.raw as any
              return `${y} mL`
            }
            return ''
          },
        },
      },
      legend: { display: false },
    },
  }

  if (showBarChart.value) {
    if (!options.scales) options.scales = {}
    options.scales['y1'] = {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: '總量 (mL)',
      },
      ticks: {
        callback: (value) => value.toString(), // 去掉千分位
      },

      grid: {
        drawOnChartArea: false,
      },
    }
  } else {
    if (options.scales) {
      delete options.scales['y1']
    }
  }

  return options
})
</script>
