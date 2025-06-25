import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStore = defineStore('userId', () => {
  const userId = ref('')
  function setUserId(newId: string) {
    userId.value = newId
  }

  const getUserPath = computed(() => `users/${userId.value}`)

  return { setUserId, getUserPath, userId }
})
