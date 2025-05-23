<template>
  <div class="target-setting">
    <h1>設定每日喝水目標</h1>
    <p>目前的目標: {{ currentTarget }} ml</p>

    <div class="input-group">
      <label for="targetAmount">設定目標 (ml):</label>
      <input
        type="number"
        id="targetAmount"
        v-model.number="targetAmount"
        placeholder="例如: 2000"
      />
    </div>

    <button @click="saveTarget">儲存目標</button>

    <p v-if="message" :class="messageType">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { database } from '@/firebase'
import { ref as dbRef, set, onValue } from 'firebase/database' // 導入 Firebase Realtime Database 相關函數

// 定義響應式變數
const targetAmount = ref<number | null>(null) // 用於綁定輸入框的值
const currentTarget = ref<number>(0) // 顯示當前儲存的目標
const message = ref<string>('') // 提示訊息
const messageType = ref<string>('') // 提示訊息類型 (成功/錯誤)

// 載入時從 Firebase 讀取現有目標
onMounted(() => {
  const targetRef = dbRef(database, 'waterTarget') // 引用 'waterTarget' 路徑

  // 監聽 'waterTarget' 路徑的數據變化
  onValue(
    targetRef,
    (snapshot) => {
      const data = snapshot.val()
      if (data !== null) {
        currentTarget.value = data
        targetAmount.value = data // 也把目標值設定到輸入框
      } else {
        currentTarget.value = 0 // 如果沒有設定，顯示 0
      }
    },
    (error) => {
      console.error('讀取喝水目標失敗:', error)
      message.value = '讀取目標失敗，請檢查網路或 Firebase 設定。'
      messageType.value = 'error'
    },
  )
})

// 儲存目標到 Firebase
const saveTarget = async () => {
  if (targetAmount.value === null || targetAmount.value <= 0) {
    message.value = '請輸入有效的喝水目標 (大於 0)。'
    messageType.value = 'error'
    return
  }

  try {
    // 將目標值寫入 'waterTarget' 路徑
    await set(dbRef(database, 'waterTarget'), targetAmount.value)
    message.value = '喝水目標儲存成功！'
    messageType.value = 'success'
  } catch (error) {
    console.error('儲存喝水目標失敗:', error)
    message.value = '儲存目標失敗，請檢查網路或 Firebase 設定。'
    messageType.value = 'error'
  }
}
</script>

<style scoped>
.target-setting {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  font-size: 1.1em;
}

.input-group {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

input[type='number'] {
  width: 80%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

.success {
  color: green;
  margin-top: 15px;
}

.error {
  color: red;
  margin-top: 15px;
}
</style>
