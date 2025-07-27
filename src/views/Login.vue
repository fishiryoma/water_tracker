<template>
  <div class="flex flex-col items-center sm:gap-6 gap-2">
    <div
      class="sm:w-20 w-14 sm:h-20 h-14 bg-gradient-to-br from-green-600 to-green-400 rounded-full flex items-center justify-center text-white sm:text-xl text-md font-bold mx-auto"
    >
      LINE
    </div>
    <h1 class="sm:text-2xl md:text-3xl text-md font-semibold text-gray-800">
      多喝水沒事沒事多喝水
    </h1>

    <div v-if="loading" class="mt-6">
      <div
        class="animate-spin border-4 border-gray-200 border-t-4 border-t-green-500 rounded-full w-8 h-8 mx-auto mb-2"
      ></div>
      <p class="text-gray-600">載入中</p>
    </div>

    <div v-if="loginError" class="bg-red-100 text-red-700 sm:p-4 p-2 rounded-lg">
      {{ loginError }}5222
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
            <strong class="block">每日喝水提醒</strong>
            <small class="text-gray-600">根據您的偏好發送客製化內容</small>
          </div>
        </div>
      </div>
      <button
        class="login-btn bg-green-600 hover:bg-green-700 text-white text-sm sm:py-3 sm:px-6 px-4 py-2 rounded-full transition transform hover:-translate-y-1 cursor-pointer"
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
import { useRouter } from 'vue-router'

import { auth } from '@/firebase'
import { OAuthProvider, signInWithCredential } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { updateUserData } from '@/hooks/useUpdateUser'

import liff from '@line/liff'

const currentUser = ref<User | null>(null)
const loginError = ref<string | null>(null)
const loading = ref(false)
const router = useRouter()

// 初始化 LIFF
let liffReady = false
async function initializeLiff() {
  try {
    await liff.init({ liffId: '2007574485-nVKgAdK9' })
    liffReady = true
    console.log('LIFF 初始化成功')
    if (liff.isInClient()) {
      console.log('在 LIFF 客戶端中')
      // 使用 liff.openWindow() 在外部瀏覽器中開啟連結
      liff.openWindow({
        url: 'https://water-record.web.app/',
        external: true,
      })
    }
  } catch (error) {
    console.error('LIFF 初始化失敗', error)
  }
}

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
    throw error
  }
}

// 處理 LINE 登入
const handleLineLogin = async () => {
  loading.value = true
  loginError.value = null

  try {
    // 等待 LIFF 初始化
    if (!liffReady) {
      await initializeLiff()
    }

    if (liff.isLoggedIn()) {
      const idToken = liff.getIDToken()
      if (idToken) {
        console.log('使用現有 ID Token 登入')
        const user = await loginWithLineToken(idToken)
        await updateUserData(user)
        router.push('/tracker')
      } else {
        console.log('無 ID Token，重新登入')
        liff.login({ redirectUri: window.location.href })
      }
    } else {
      console.log('LIFF 未登入，導向登入頁')
      liff.login({ redirectUri: window.location.href })
    }
  } catch (error) {
    console.error('登入失敗:', error)
    loginError.value = '登入失敗，請重試'
  }
}

// 檢查登入狀態
const checkLoginStatus = async () => {
  loading.value = true
  loginError.value = null

  // 先檢查 Firebase 是否已登入
  try {
    if (auth.currentUser) {
      console.log('Firebase 已登入')
      currentUser.value = auth.currentUser
      try {
        await updateUserData(auth.currentUser)
        router.push('/tracker')
      } catch (error) {
        console.error('更新使用者資料失敗:', error)
        loginError.value = '更新使用者資料失敗，請重新登入'
      }
      return
    }

    // 等待 LIFF 初始化
    if (!liffReady) {
      await initializeLiff()
    }

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
          loginError.value = '自動登入失敗，請重新登入'
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
