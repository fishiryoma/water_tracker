import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, onValue } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { useGlobalErrorStore } from '@/stores/globalError'

export const useWaterStore = defineStore('water', () => {
  const water = ref(null)
  const { getUserPath } = storeToRefs(useUserIdStore())
  const testId = `${getUserPath.value}/waterTarget`
  const errorStore = useGlobalErrorStore()

  // 實作用localstorage cache
  const targetRef = dbRef(database, testId)
  onValue(
    targetRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data !== null) {
        water.value = data
      } else {
        water.value = 1000
      }
    },
    (error) => {
      console.error('讀取喝水目標失敗:', error)
      errorStore.handleFirebaseError(error, i18n.global.t('ERROR.READ_TARGET'))
    },
  )

  return { water }
})
