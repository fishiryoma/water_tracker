import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTheme } from '@/hooks/useTheme'

interface WeatherData {
  isInitialized: boolean
  weathercode: number | null
  lastFetchTime: Date | null
  latitude: number | null
  longitude: number | null
}

export const useWeatherStore = defineStore('weather', () => {
  const weather = ref<WeatherData>({
    isInitialized: false,
    latitude: null,
    longitude: null,
    lastFetchTime: null,
    weathercode: null,
    // 0, 1晴朗 --> sakura
    // 2, 3多雲 --> rain
  })
  const { currentTheme } = useTheme()

  const fetchWeather = async () => {
    if (weather.value.isInitialized) return
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
      weather.value.latitude = position.coords.latitude
      weather.value.longitude = position.coords.longitude
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${weather.value.latitude}&longitude=${weather.value.longitude}&current_weather=true`,
      )
      const data = await response.json()
      const newWeatherCode = data.current_weather.weathercode
      weather.value.weathercode = newWeatherCode
      weather.value.lastFetchTime = new Date()
      weather.value.isInitialized = true
      // 更新主題
      if (newWeatherCode === 0 || newWeatherCode === 1) {
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
    } catch (err) {
      console.error(err)
    }
  }

  const isFresh = computed(() => {
    if (!weather.value.lastFetchTime) return false
    const now = new Date()
    // 設定資料有效期為 1 小時
    return now.getTime() - weather.value.lastFetchTime.getTime() < 60 * 60 * 1000
  })

  return {
    weather,
    isFresh,
    fetchWeather,
  }
})
