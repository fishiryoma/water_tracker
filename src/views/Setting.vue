<template>
  <div class="flex flex-col text-primary-800 gap-6 w-full">
    <div>
      <h3 :class="h3Class">{{ $t('SETTING.THEME') }}</h3>
      <div class="flex items-center gap-4 justify-center">
        <div v-for="theme in themes" :key="theme.value" class="flex items-center gap-2">
          <input
            type="radio"
            :id="theme.value"
            :value="theme.value"
            v-model="currentTheme"
            class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
          />
          <label :for="theme.value" class="text-base">{{ theme.text }}</label>
        </div>
      </div>
    </div>
    <div>
      <h3 :class="h3Class">{{ $t('SETTING.DEFAULT_BUTTONS') }}</h3>
      <div class="flex justify-center gap-2">
        <FormInput
          v-model="defaultWaterIntakeButton[0]"
          type="number"
          :label="`${t('SETTING.BUTTON')} 1`"
          :outerClass="inputClass"
        />
        <FormInput
          v-model="defaultWaterIntakeButton[1]"
          type="number"
          :label="`${t('SETTING.BUTTON')} 2`"
          :outerClass="inputClass"
        />
        <FormInput
          v-model="defaultWaterIntakeButton[2]"
          type="number"
          :label="`${t('SETTING.BUTTON')} 3`"
          :outerClass="inputClass"
        />
      </div>
      <Button type="primary" outerClass="mt-4" @click="saveSettings">{{
        $t('BUTTON.SAVE')
      }}</Button>
      <div v-if="showSuccess" class="text-green-500 mt-2">{{ $t('SUCCESS.SETTINGS_SAVED') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTheme } from '@/hooks/useTheme'
import FormInput from '@/components/FormInput.vue'
import Button from '@/components/Button.vue'
import { database } from '@/firebase'
import { ref as dbRef, update, get, child } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { currentTheme } = useTheme()
const { getUserPath } = storeToRefs(useUserIdStore())

const h3Class = 'text-lg font-bold mb-3 border-b-2 border-primary-300 pb-1'
const inputClass = 'w-full py-1 sm:py-1'

const themes = computed(() => [
  { value: 'sakura', text: t('SETTING.THEME_SAKURA') },
  { value: 'rain', text: t('SETTING.THEME_RAIN') },
])

const defaultWaterIntakeButton = ref([350, 500, 750])
const showSuccess = ref(false)

onMounted(() => {
  const settingsRef = dbRef(database)
  get(child(settingsRef, `${getUserPath.value}/defaultWaterIntakeButton`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        defaultWaterIntakeButton.value = snapshot.val()
      }
    })
    .catch((error) => {
      console.error('Error loading settings:', error)
    })
})

const saveSettings = async () => {
  try {
    await update(dbRef(database, getUserPath.value), {
      defaultWaterIntakeButton: defaultWaterIntakeButton.value,
    })
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}
</script>
