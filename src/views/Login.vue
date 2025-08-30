<template>
  <div class="flex flex-col items-center sm:gap-6 gap-2">
    <div
      class="sm:w-20 w-14 sm:h-20 h-14 bg-gradient-to-br from-green-600 to-green-400 rounded-full flex items-center justify-center text-white sm:text-xl text-md font-bold mx-auto"
    >
      LINE
    </div>
    <h1 class="sm:text-2xl md:text-3xl text-md font-semibold text-gray-800">
      {{ t('LOGIN.SLOGAN') }}
    </h1>

    <div v-if="loading" class="mt-6">
      <div
        class="animate-spin border-4 border-gray-200 border-t-4 border-t-green-500 rounded-full w-8 h-8 mx-auto mb-2"
      ></div>
      <p class="text-gray-600">{{ t('LOADING.DEFAULT') }}</p>
    </div>
    <!-- v-if="isInLineApp() && !loading" -->
    <!-- 在 LINE 內建瀏覽器的特殊提示 -->
    <div v-if="isInLineApp() && !loading" class="text-primary-700 sm:p-4 p-2 rounded-lg mb-4">
      <div class="flex items-start">
        <div class="mr-3">📱</div>
        <div>
          <strong class="block mb-2">{{ t('LOGIN.LINE_NOTICE_TITLE') }}</strong>
          <ol class="text-sm space-y-1 list-decimal">
            <li>{{ t('LOGIN.LINE_NOTICE_STEP1') }}</li>
            <li>{{ t('LOGIN.LINE_NOTICE_STEP2') }}</li>
            <li>{{ t('LOGIN.LINE_NOTICE_STEP3') }}</li>
          </ol>
        </div>
      </div>
    </div>

    <div v-if="!currentUser && !loading">
      <div class="space-y-4 mb-6 text-left">
        <div class="flex items-start bg-gray-100 sm:p-4 p-2 rounded-lg">
          <div
            class="text-white bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3"
          >
            🔔
          </div>
          <div>
            <strong class="block">{{ t('LOGIN.FEATURE_REMINDER_TITLE') }}</strong>
            <small class="text-gray-600">{{ t('LOGIN.FEATURE_REMINDER_DESC') }}</small>
          </div>
        </div>
      </div>
      <button
        v-if="!isInLineApp() && !loading"
        class="login-btn bg-green-600 hover:bg-green-700 text-white text-sm sm:py-3 sm:px-6 px-4 py-2 rounded-full transition transform hover:-translate-y-1 cursor-pointer"
        @click="handleLineLogin"
        :disabled="loading"
      >
        {{ t('BUTTON.LINK_LINE') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { OAuthProvider, signInWithCredential } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { updateUserData } from '@/hooks/useUpdateUser'
import { useGlobalErrorStore } from '@/stores/globalError'
import { useI18n } from 'vue-i18n'

import liff from '@line/liff'

const currentUser = ref<User | null>(null)
const loading = ref(false)
const router = useRouter()
const errorStore = useGlobalErrorStore()
const { t } = useI18n()

// 使用 LINE ID Token 登入 Firebase
const loginWithLineToken = async (idToken: string) => {
  try {
    const provider = new OAuthProvider('oidc.line')
    provider.setCustomParameters({ id_token: idToken })

    const credential = provider.credential({ idToken })
    const result = await signInWithCredential(auth, credential)

    console.log('Firebase 登入成功')
    return result.user
  } catch (error) {
    console.error('Firebase 登入失敗:', error)
    errorStore.handleFirebaseError(error, 'Firebase 登入')
    throw error
  }
}

// 檢查是否在 LINE 內建瀏覽器
const isInLineApp = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('line')
}

// 處理 LINE 登入
const handleLineLogin = async () => {
  loading.value = true

  try {
    // 檢查是否已登入
    if (liff.isLoggedIn()) {
      const idToken = liff.getIDToken()
      if (idToken) {
        console.log('使用現有 ID Token 登入')
        const user = await loginWithLineToken(idToken)
        await updateUserData(user)
        router.push('/tracker')
      } else {
        console.log('無 ID Token，重新登入')
        liff.login({
          redirectUri: window.location.href,
        })
      }
    } else {
      console.log('LIFF 未登入，導向登入頁')
      liff.login({
        redirectUri: window.location.href,
      })
    }
  } catch (error) {
    console.error('登入失敗:', error)
    errorStore.handleNetworkError(error, '用戶登入')
  } finally {
    loading.value = false
  }
}

// 檢查登入狀態
const checkLoginStatus = async () => {
  loading.value = true

  try {
    // 先檢查 Firebase 是否已登入
    if (auth.currentUser) {
      console.log('Firebase 已登入')
      currentUser.value = auth.currentUser
      try {
        await updateUserData(auth.currentUser)
        router.push('/tracker')
      } catch (error) {
        console.error('更新使用者資料失敗:', error)
        errorStore.handleFirebaseError(error, '更新使用者資料')
      }
      return
    }

    // 檢查 LIFF 登入狀態
    if (liff.isLoggedIn()) {
      const idToken = liff.getIDToken()
      if (idToken) {
        console.log('LIFF 已登入，使用 ID Token 登入 Firebase')
        try {
          const user = await loginWithLineToken(idToken)
          await updateUserData(user)
          router.push('/tracker')
        } catch (error) {
          console.error('自動登入失敗:', error)
          errorStore.handleNetworkError(error, t('ERROR.AUTO_LOGIN'))
        }
      }
    }
  } catch (error) {
    console.error('檢查登入狀態失敗:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('組件掛載')
  checkLoginStatus()
})
</script>
