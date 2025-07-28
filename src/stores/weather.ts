import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTheme } from '@/hooks/useTheme'

interface WeatherData {
  isInitialized: boolean
  weathercode: number | null
  lastFetchTime: Date | null
  latitude: number | null
  longitude: number | null
  isLoading: boolean
  error: string | null
}

export const useWeatherStore = defineStore('weather', () => {
  const weather = ref<WeatherData>({
    isInitialized: false,
    latitude: null,
    longitude: null,
    lastFetchTime: null,
    weathercode: null,
    isLoading: false,
    error: null,
    // 0, 1晴朗 --> sakura
    // 2, 3多雲 --> rain
  })
  const { currentTheme } = useTheme()

  // 從 localStorage 獲取緩存的天氣資料
  const loadCachedWeather = () => {
    try {
      const cached = localStorage.getItem('weather-cache')
      if (cached) {
        const data = JSON.parse(cached)
        const cacheTime = new Date(data.timestamp)
        const now = new Date()
        // 如果緩存在1小時內，使用緩存資料
        if (now.getTime() - cacheTime.getTime() < 60 * 60 * 1000) {
          weather.value.weathercode = data.weathercode
          updateTheme(data.weathercode)
          return true
        }
      }
    } catch (error) {
      console.error('載入緩存天氣資料失敗:', error)
    }
    return false
  }

  // 緩存天氣資料到 localStorage
  const cacheWeather = (weathercode: number) => {
    try {
      const cacheData = {
        weathercode,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('weather-cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('緩存天氣資料失敗:', error)
    }
  }

  // 更新主題的獨立函數
  const updateTheme = (weathercode: number) => {
    if (weathercode === 0 || weathercode === 1) {
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

  const fetchWeather = async (forceRefresh = false) => {
    // 如果已經初始化且不是強制刷新，則跳過
    if (weather.value.isInitialized && !forceRefresh) return

    // 如果不是強制刷新，先嘗試載入緩存
    if (!forceRefresh && loadCachedWeather()) {
      weather.value.isInitialized = true
      return
    }

    weather.value.isLoading = true
    weather.value.error = null

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000, // 10秒超時
          maximumAge: 300000, // 5分鐘內的位置緩存可接受
        })
      })

      weather.value.latitude = position.coords.latitude
      weather.value.longitude = position.coords.longitude

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${weather.value.latitude}&longitude=${weather.value.longitude}&current_weather=true`,
        { 
          signal: AbortSignal.timeout(10000) // 10秒超時
        }
      )

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`)
      }

      const data = await response.json()
      const newWeatherCode = data.current_weather.weathercode
      
      weather.value.weathercode = newWeatherCode
      weather.value.lastFetchTime = new Date()
      weather.value.isInitialized = true
      
      // 緩存天氣資料
      cacheWeather(newWeatherCode)
      
      // 更新主題
      updateTheme(newWeatherCode)
      
    } catch (err) {
      console.error('獲取天氣資料失敗:', err)
      weather.value.error = err instanceof Error ? err.message : '未知錯誤'
      
      // 如果 API 失敗，嘗試使用緩存或預設主題
      if (!loadCachedWeather()) {
        // 如果沒有緩存，使用預設的櫻花主題
        updateTheme(0) // 預設為晴天
      }
    } finally {
      weather.value.isLoading = false
    }
  }

  const isFresh = computed(() => {
    if (!weather.value.lastFetchTime) return false
    const now = new Date()
    // 設定資料有效期為 1 小時
    return now.getTime() - weather.value.lastFetchTime.getTime() < 60 * 60 * 1000
  })

  // 手動重試函數
  const retry = () => {
    weather.value.isInitialized = false
    return fetchWeather(true)
  }

  return {
    weather,
    isFresh,
    fetchWeather,
    retry,
    loadCachedWeather,
  }
})
