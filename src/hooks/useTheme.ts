import { ref, watch } from 'vue'

// 不在初始化時立即設置主題，等待天氣資料或使用緩存
const currentTheme = ref<'sakura' | 'rain'>('sakura')

// 設置初始主題的函數
const setInitialTheme = () => {
  // 嘗試從 localStorage 獲取上次的主題
  try {
    const cached = localStorage.getItem('theme-cache')
    if (cached && (cached === 'sakura' || cached === 'rain')) {
      currentTheme.value = cached as 'sakura' | 'rain'
      document.documentElement.setAttribute('data-theme', cached)
      return
    }
  } catch (error) {
    console.error('載入緩存主題失敗:', error)
  }
  
  // 如果沒有緩存，設置預設主題
  document.documentElement.setAttribute('data-theme', 'sakura')
}

// 初始化時設置主題
setInitialTheme()

watch(currentTheme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
  // 緩存主題選擇
  try {
    localStorage.setItem('theme-cache', newTheme)
  } catch (error) {
    console.error('緩存主題失敗:', error)
  }
})

export function useTheme() {
  return { 
    currentTheme,
    setInitialTheme 
  }
}
