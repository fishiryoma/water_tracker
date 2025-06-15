<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Petal from './views/Background.vue'
</script>

<template>
  <!-- <header class="bg-pink-200 text-rose-400 p-4 shadow-md">
  </header> -->

  <Petal>
    <img src="./assets/bottom.png" class="logo" />
    <RouterView />
  </Petal>

  <div
    class="flex flex-col items-center justify-center bg-green-600 text-white rounded-full px-4 py-2 absolute bottom-4 right-1/2 transform translate-x-[180px] sm:translate-x-[200px] hover:opacity-80 cursor-pointer duration-200"
  >
    <div>登入</div>
  </div>
  <div
    class="flex flex-col items-center justify-center bg-pink-700/30 text-white rounded-full rounded-l-none p-1 absolute bottom-4 left-1/2 transform -translate-x-[180px] sm:-translate-x-[200px] hover:bg-pink-700/80 cursor-pointer duration-500"
  >
    <RouterLink to="/target" class="block px-4 py-1 rounded text-base flex-4 sm:flex-none"
      >更改每日喝水目標</RouterLink
    >
  </div>
</template>

<style>
#app {
  font-family: 'Huninn', sans-serif;
  font-weight: 400;
  font-style: normal;
}

.logo {
  mix-blend-mode: multiply;
  width: 100px;
}
</style>
