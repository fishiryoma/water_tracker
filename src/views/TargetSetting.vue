<template>
  <PageLoading :isLoading="isLoading" />
  <template v-if="!isLoading">
    <h1 class="sm:text-3xl text-xl font-bold text-gray-800">{{ $t('TITLE.TARGET') }}</h1>
    <div class="w-full my-4">
      <FourDigitInput v-model="targetAmount" />
    </div>
    <!-- <div class="flex gap-3"> -->
      <Button @click="saveTarget" outerClass="sm:w-40 w-24">{{ $t('BUTTON.CHANGE') }}</Button>
      <!-- <Button @click="resetTarget">{{ $t('BUTTON.RESET') }}</Button> -->
    <!-- </div> -->
    <LoadingSpinner :show="updateLoading" />
    <p v-if="successMessage" class="mt-4 text-sm text-green-600 font-medium">
      {{ successMessage }}
    </p>
  </template>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue'
import FourDigitInput from '@/components/FourDigitInput.vue'
import { ref, watchEffect } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, set, get, update } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { useGlobalErrorStore } from '@/stores/globalError'
import { storeToRefs } from 'pinia'
import { useWaterStore } from '@/stores/water'
import { formatDateToUserTimeZone } from '@/utils'
import { useI18n } from 'vue-i18n'
import PageLoading from '@/components/PageLoading.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { t } = useI18n()

const { getUserPath } = storeToRefs(useUserIdStore())
const { water: currentTarget } = storeToRefs(useWaterStore())
const errorStore = useGlobalErrorStore()
const testId = `${getUserPath.value}/waterTarget`
const targetAmount = ref<number | null>(null)
const successMessage = ref<string>('')
const isLoading = ref(true)
const updateLoading = ref(false)

watchEffect(() => {
  if (currentTarget.value) {
    targetAmount.value = currentTarget.value
    isLoading.value = false
  }
})

const saveTarget = async () => {
  if (targetAmount.value === null || targetAmount.value <= 0) {
    errorStore.showWarning(t('ERROR.INVALID_TARGET'))
    return
  }
  if (targetAmount.value === currentTarget.value) {
    errorStore.showWarning(t('ERROR.TARGET_SAME'))
    return
  }

  updateLoading.value = true
  try {
    await set(dbRef(database, testId), targetAmount.value)
    successMessage.value = t('SUCCESS.TARGET_UPDATED')
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('儲存喝水目標失敗:', error)
    errorStore.handleFirebaseError(error, t('ERROR.SAVE_TARGET'))
  }

  // 更改目標後，立即檢查新的達標狀況
  try {
    const getTodayDate = (): string => formatDateToUserTimeZone(new Date())
    const targetUrl = `${getUserPath.value}/dailyRecords/${getTodayDate()}`
    const todayDrankRef = dbRef(database, targetUrl)
    const todayDrankSnapshot = await get(todayDrankRef)

    if (todayDrankSnapshot.val()) {
      const { totalDrank, finished } = todayDrankSnapshot.val()
      if (totalDrank >= targetAmount.value && !finished) {
        await update(dbRef(database, targetUrl), { finished: true })
      } else if (totalDrank < targetAmount.value && finished) {
        await update(dbRef(database, targetUrl), { finished: false })
      }
    }
  } catch (e) {
    console.error('更新今日喝水紀錄失敗:', e)
    errorStore.handleFirebaseError(e, t('ERROR.UPDATE_TODAY_RECORD'))
  } finally {
    updateLoading.value = false
  }
}

// const resetTarget = () => {
//   targetAmount.value = currentTarget.value
// }
</script>

<style scoped></style>
