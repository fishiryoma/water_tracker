<template>
  <div
    class="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600"
  >
    <div class="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-11/12 text-center">
      <!-- Logo & 標題 -->
      <div
        class="w-20 h-20 bg-gradient-to-br from-green-600 to-green-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
      >
        L
      </div>
      <h1 class="text-2xl md:text-3xl font-semibold mb-4 text-gray-800">我的 LINE 服務</h1>

      <!-- 載入中 -->
      <div v-if="loading" class="mb-4">
        <div
          class="animate-spin border-4 border-gray-200 border-t-4 border-t-green-500 rounded-full w-8 h-8 mx-auto mb-2"
        ></div>
        <p class="text-gray-600">載入中...</p>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="error" class="mb-4 bg-red-100 text-red-700 p-4 rounded-lg">
        {{ error }}
      </div>

      <!-- 成功訊息 -->
      <div v-if="success" class="mb-4 bg-green-100 text-green-700 p-4 rounded-lg">
        {{ success }}
      </div>

      <!-- 未登入 -->
      <div v-if="!user && !loading">
        <p class="text-gray-700 mb-2">歡迎來到我們的服務網站！</p>
        <p class="text-gray-700 mb-4">請先連結您的 LINE 帳戶以享受個人化服務。</p>

        <div class="space-y-4 mb-6 text-left">
          <div class="flex items-start bg-gray-100 p-4 rounded-lg">
            <div
              class="text-white bg-green-600 rounded-full w-8 h-8 flex items-center justify-center mr-3"
            >
              📱
            </div>
            <div>
              <strong class="block">每日個人化訊息</strong>
              <small class="text-gray-600">根據您的偏好發送客製化內容</small>
            </div>
          </div>
          <div class="flex items-start bg-gray-100 p-4 rounded-lg">
            <div
              class="text-white bg-green-600 rounded-full w-8 h-8 flex items-center justify-center mr-3"
            >
              🔔
            </div>
            <div>
              <strong class="block">即時通知服務</strong>
              <small class="text-gray-600">重要資訊不錯過</small>
            </div>
          </div>
          <div class="flex items-start bg-gray-100 p-4 rounded-lg">
            <div
              class="text-white bg-green-600 rounded-full w-8 h-8 flex items-center justify-center mr-3"
            >
              📊
            </div>
            <div>
              <strong class="block">個人資料管理</strong>
              <small class="text-gray-600">管理您的偏好設定</small>
            </div>
          </div>
        </div>

        <button
          class="login-btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition transform hover:-translate-y-1"
          @click="login"
          :disabled="loading"
        >
          🔗 連結 LINE 帳戶
        </button>

        <p class="mt-4 text-sm text-gray-600">
          還沒加入我們的 LINE Bot 嗎？<br />
          <a
            href="https://line.me/R/ti/p/@your-line-bot-id"
            target="_blank"
            class="text-green-600 hover:underline"
          >
            點擊這裡加入 LINE Bot
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const user = ref(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

function login() {
  loading.value = true
  error.value = ''
  success.value = ''

  // 登入流程
}

function logout() {
  user.value = null
  success.value = ''
}
</script>
