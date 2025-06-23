import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStore = defineStore('userId', () => {
  const userId = ref('users/U235feefa61fc360d62eea6c7e455eb13')
  return { userId }
})
