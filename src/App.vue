<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Petal from '@/views/Background.vue'
import Container from '@/views/Container.vue'
import liff from '@line/liff'

import { useRouter } from 'vue-router'
import { useStore } from '@/hooks/useStore'
import { storeToRefs } from 'pinia'
import { auth } from '@/firebase' // 導入 Firebase Auth 實例
import { signOut } from 'firebase/auth' // <-- 這裡新增導入 signOut

const router = useRouter()
const { setUserId } = useStore()
const { userId } = storeToRefs(useStore())

const handleLogout = async (): Promise<void> => {
  try {
    await signOut(auth)
    setUserId('')
    if (liff.isLoggedIn()) {
      liff.logout() // 呼叫 LIFF 的登出方法
    }
    router.push('/')
  } catch (error: any) {
    console.error('登出失敗:', error)
  }
}
</script>

<template>
  <Petal>
    <img
      src="./assets/bottom-fotor-bg-remover.png"
      class="w-[100px] mx-auto mt-4 rounded-full bg-amber-100/50"
    />
    <Container>
      <RouterView />
    </Container>
    <div class="relative" v-if="userId.length > 0">
      <div
        @click="handleLogout"
        class="flex flex-col items-center justify-center bg-green-600 text-white rounded-full px-4 py-2 absolute -bottom-12 right-1/2 transform translate-x-[180px] sm:translate-x-[200px] hover:opacity-80 cursor-pointer duration-200"
      >
        <img class="w-7 stroke-orange-50" src="@/assets/door.svg" />
      </div>
      <div
        class="absolute -bottom-12 left-1/2 transform -translate-x-[170px] sm:-translate-x-[200px] cursor-pointer"
      >
        <RouterLink to="/target"><img src="@/assets/target.svg" class="w-14" /></RouterLink>
      </div>
      <div
        class="absolute -bottom-12 left-1/2 transform -translate-x-[90px] sm:-translate-x-[120px] cursor-pointer"
      >
        <RouterLink to="/tracker"><img src="@/assets/drink.svg" class="w-14" /></RouterLink>
      </div>
    </div>
  </Petal>
</template>

<style>
#app {
  font-family: 'Huninn', sans-serif;
  font-weight: 400;
  font-style: normal;
}
</style>
