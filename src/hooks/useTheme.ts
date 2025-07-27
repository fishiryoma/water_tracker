import { ref, watch } from 'vue'

document.documentElement.setAttribute('data-theme', 'sakura')

const currentTheme = ref<'sakura' | 'rain'>('sakura')

watch(currentTheme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
})

export function useTheme() {
  return { currentTheme }
}
