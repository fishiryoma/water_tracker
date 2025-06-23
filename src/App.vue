<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Petal from '@/views/Background.vue'
import Container from '@/views/Container.vue'
import liff from '@line/liff'

async function initializeLiff() {
  try {
    await liff.init({ liffId: '2007574485-nVKgAdK9' }) // **替換成你的 LIFF ID**
    console.log('LIFF init success')
    // 如果需要，可以在這裡檢查 LIFF 是否登入
    // if (!liff.isLoggedIn()) {
    //   liff.login(); // 強制登入
    // }
  } catch (error) {
    console.error('LIFF init failed', error)
  }
}
initializeLiff()
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
    <!-- 決定Button要以誰為基準點render -->
    <!-- <div class="relative"> -->
    <div
      class="flex flex-col items-center justify-center bg-green-600 text-white rounded-full px-4 py-2 absolute bottom-4 right-1/2 transform translate-x-[180px] sm:translate-x-[200px] hover:opacity-80 cursor-pointer duration-200"
    >
      <div>L</div>
    </div>
    <div
      class="absolute bottom-4 left-1/2 transform -translate-x-[180px] sm:-translate-x-[200px] cursor-pointer"
    >
      <RouterLink to="/target"><img src="@/assets/target.svg" class="w-14" /></RouterLink>
    </div>
    <div
      class="absolute bottom-4 left-1/2 transform -translate-x-[150px] sm:-translate-x-[120px] cursor-pointer"
    >
      <RouterLink to="/tracker"><img src="@/assets/drink.svg" class="w-14" /></RouterLink>
    </div>
    <!-- </div> -->
  </Petal>
</template>

<style>
#app {
  font-family: 'Huninn', sans-serif;
  font-weight: 400;
  font-style: normal;
}
</style>
