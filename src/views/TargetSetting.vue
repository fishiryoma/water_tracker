<template>
  <h1 class="sm:text-3xl text-xl font-bold text-gray-800">目標喝水量</h1>
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
    <Button>
      <RouterLink to="/tracker">返回</RouterLink>
    </Button>
    <Button @click="saveTarget">更改目標</Button>
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

const { getUserPath } = storeToRefs(useUserIdStore())
const { water: currentTarget } = storeToRefs(useWaterStore())
const errorStore = useGlobalErrorStore()
const testId = `${getUserPath.value}/waterTarget`
const targetAmount = ref<number | null>(null)
const successMessage = ref<string>('')

const saveTarget = async () => {
  let tempTarget = null
  if (targetAmount.value === null || targetAmount.value <= 0) {
    errorStore.showWarning('請輸入有效的目標數值')
    return
  }

  try {
    await set(dbRef(database, testId), targetAmount.value)
    successMessage.value = '✅目標更新成功'
    tempTarget = targetAmount.value
    targetAmount.value = null
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('儲存喝水目標失敗:', error)
    errorStore.handleFirebaseError(error, '儲存喝水目標')
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
    errorStore.handleFirebaseError(e, '更新今日喝水紀錄')
  }
}
</script>

<style scoped></style>
