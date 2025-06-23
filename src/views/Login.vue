<template>
  <div class="">
    <!-- Logo & 標題 -->
    <div
      class="w-20 h-20 bg-gradient-to-br from-green-600 to-green-400 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4"
    >
      LINE
    </div>
    <h1 class="text-2xl md:text-3xl font-semibold mb-4 text-gray-800">多喝水沒事沒事多喝水</h1>

    <!-- 載入中 -->
    <div v-if="loading" class="mb-4">
      <div
        class="animate-spin border-4 border-gray-200 border-t-4 border-t-green-500 rounded-full w-8 h-8 mx-auto mb-2"
      ></div>
      <p class="text-gray-600">載入中...</p>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="loginError" class="mb-4 bg-red-100 text-red-700 p-4 rounded-lg">
      {{ loginError }}
    </div>

    <!-- 成功訊息 -->
    <div v-if="success" class="mb-4 bg-green-100 text-green-700 p-4 rounded-lg">
      {{ success }}
    </div>

    <!-- 未登入 -->
    <div v-if="!user && !loading">
      <p class="text-gray-700 mb-4">請先連結 LINE 帳戶才能享受通知服務</p>

      <div class="space-y-4 mb-6 text-left">
        <div class="flex items-start bg-gray-100 p-4 rounded-lg">
          <div
            class="text-white bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3"
          >
            🔔
          </div>
          <div>
            <strong class="block">每日喝水提醒</strong>
            <small class="text-gray-600">根據您的偏好發送客製化內容</small>
          </div>
        </div>
        <div class="flex items-start bg-gray-100 p-4 rounded-lg">
          <div
            class="text-white bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3"
          >
            📱
          </div>
          <div>
            <strong class="block">多喝水維持身體健康</strong>
            <small class="text-gray-600">輕鬆代謝不求人</small>
          </div>
        </div>
      </div>
      <button
        class="login-btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition transform hover:-translate-y-1"
        @click="handleLineLogin"
        :disabled="loading"
      >
        🔗 連結 LINE 帳戶
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auth } from '@/firebase' // 導入 Firebase Auth 實例
import { OAuthProvider, signInWithCredential } from 'firebase/auth' // 導入必要的 Firebase 方法
import type { User } from 'firebase/auth' // 導入必要的 Firebase 方法

import liff from '@line/liff' // 導入 LIFF

const currentUser = ref<User | null>(null) // 使用 Firebase User 類型
const loginError = ref<string | null>(null)
const FIREBASE_LINE_PROVIDER_ID = 'oidc.line'

const user = ref(null)
const loading = ref(false)

const success = ref('')

/**
 * 使用 LINE ID Token 登入 Firebase Authentication。
 * @param {string} lineIdToken - 從 LINE 獲取的使用者 ID Token。
 * @returns {Promise<void>}
 */
const firebaseAuthWithLine = async (lineIdToken: string): Promise<void> => {
  loginError.value = null // 清除之前的錯誤

  try {
    const provider = new OAuthProvider(FIREBASE_LINE_PROVIDER_ID)
    // 將 LINE ID Token 作為自訂參數傳遞給 Firebase
    provider.setCustomParameters({
      id_token: lineIdToken,
    })

    // 使用 ID Token 建立 Firebase 憑證並登入
    const credential = provider.credential({ idToken: lineIdToken })
    const result = await signInWithCredential(auth, credential)

    currentUser.value = result.user
    console.log('Firebase 登入成功！使用者 UID:', currentUser.value.uid)
  } catch (error: any) {
    console.error('Firebase 登入失敗：', error)
    loginError.value = `Firebase 登入失敗: ${error.message}`

    if (error.code === 'auth/account-exists-with-different-credential') {
      // 處理多個登入方式連結到同一帳號的情況
      loginError.value += ' - 此郵箱已被其他登入方式使用。'
      // 這裡你可以提示用戶先用已有的方式登入，然後再進行帳號連結
    }
  }
}

/**
 * 處理 LINE 登入流程。
 * @returns {Promise<void>}
 */
const handleLineLogin = async (): Promise<void> => {
  loginError.value = null // 清除之前的錯誤

  try {
    if (!liff.isLoggedIn()) {
      // 如果未登入 LIFF，則導向 LINE 登入頁面
      console.log('Not logged in to LIFF, redirecting for login...')
      liff.login({
        redirectUri: window.location.href, // 登入成功後導回當前頁面
      })
    } else {
      // 如果已登入 LIFF
      const idToken = liff.getIDToken()
      if (idToken) {
        console.log('Already logged in to LIFF. ID Token:', idToken)
        await firebaseAuthWithLine(idToken)
      } else {
        // 如果已登入但沒有 ID Token (可能因為 scope 不足或 token 過期)，則重新登入
        console.warn('LIFF logged in but no ID Token. Attempting re-login with correct scope.')
        liff.login({
          redirectUri: window.location.href,
        })
      }
    }
  } catch (error: any) {
    console.error('Error during LINE login process:', error)
    loginError.value = `LINE 登入啟動失敗: ${error.message}`
  }
}

// 組件掛載時執行
onMounted(async () => {
  // 監聽 Firebase 登入狀態變化
  auth.onAuthStateChanged((firebaseUser) => {
    currentUser.value = firebaseUser
    if (firebaseUser) {
      console.log('Firebase user is logged in:', firebaseUser.uid)
    } else {
      console.log('No Firebase user logged in.')
    }
  })

  // 如果 LIFF 已經初始化且使用者已經登入，嘗試直接登入 Firebase
  // 這處理了用戶從 LINE 授權頁面跳轉回來的情況
  if (liff.isLoggedIn()) {
    try {
      const idToken = liff.getIDToken()
      if (idToken) {
        console.log('LIFF is initialized and logged in, attempting Firebase login...')
        await firebaseAuthWithLine(idToken)
      } else {
        console.warn('LIFF logged in but no ID Token available after redirect. Check scopes.')
      }
    } catch (e: any) {
      console.error('Error processing LIFF callback:', e)
      loginError.value = `處理 LIFF 回呼失敗: ${e.message}`
    }
  }
})
</script>
