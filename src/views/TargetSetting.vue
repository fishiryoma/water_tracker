<template>
  <h1 class="sm:text-3xl text-xl font-bold text-gray-800">{{ $t('TITLE.TARGET') }}</h1>
  <p>
    <span class="font-semibold text-primary-700 sm:text-3xl text-xl">{{ currentTarget }}</span>
    ml
  </p>
  <div class="w-full">
    <FormInput
      type="number"
      step="100"
      id="targetAmount"
      v-model.number="targetAmount"
      placeholder="ex: 2000"
      inputmode="numeric"
      pattern="[0-9]*"
    />
  </div>
  <div class="flex gap-3 mt-4">
    <Button @click="saveTarget" outerClass="sm:w-40 w-24">{{ $t('BUTTON.CHANGE') }}</Button>
  </div>
  <p v-if="successMessage" class="mt-4 text-sm text-green-600 font-medium">{{ successMessage }}</p>
</template>

<script setup lang="ts">
import Button from '@/components/Button.vue'
import FormInput from '@/components/FormInput.vue'
import { ref } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, set, get, update } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { useGlobalErrorStore } from '@/stores/globalError'
import { storeToRefs } from 'pinia'
import { useWaterStore } from '@/stores/water'
import { formatDateToTaiwan } from '@/utils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { getUserPath } = storeToRefs(useUserIdStore())
const { water: currentTarget } = storeToRefs(useWaterStore())
const errorStore = useGlobalErrorStore()
const testId = `${getUserPath.value}/waterTarget`
const targetAmount = ref<number | null>(null)
const successMessage = ref<string>('')

const saveTarget = async () => {
  let tempTarget = null
  if (targetAmount.value === null || targetAmount.value <= 0) {
    errorStore.showWarning(t('ERROR.INVALID_TARGET'))
    return
  }

  try {
    await set(dbRef(database, testId), targetAmount.value)
    successMessage.value = t('SUCCESS.TARGET_UPDATED')
    tempTarget = targetAmount.value
    targetAmount.value = null
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('儲存喝水目標失敗:', error)
    errorStore.handleFirebaseError(error, t('ERROR.SAVE_TARGET'))
  }

  // 檢查今日是否已達成新的目標
  try {
    const getTodayDate = (): string => formatDateToTaiwan(new Date())
    const targetUrl = `${getUserPath.value}/dailyRecords/${getTodayDate()}`
    const todayDrankRef = dbRef(database, targetUrl)
    const todayDrankSnapshot = await get(todayDrankRef)
    const { totalDrank, finished } = todayDrankSnapshot.val()

    if (totalDrank >= tempTarget && !finished) {
      await update(dbRef(database, targetUrl), { finished: true })
    } else if (totalDrank < tempTarget && finished) {
      await update(dbRef(database, targetUrl), { finished: false })
    }
  } catch (e) {
    console.error('更新今日喝水紀錄失敗:', e)
    errorStore.handleFirebaseError(e, t('ERROR.UPDATE_TODAY_RECORD'))
  }
}
</script>

<style scoped></style>
