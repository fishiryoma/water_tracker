import { ref, watch } from 'vue'

document.documentElement.setAttribute('data-theme', 'sakura')

export function useTheme() {
  const currentTheme = ref<'sakura' | 'rain'>('sakura')
  // const setTheme = (theme: 'sakura' | 'rain') => {
  //   currentTheme.value = theme
  //   document.documentElement.setAttribute('data-theme', theme)
  // }

  watch(currentTheme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
  })

  return { currentTheme }
}
