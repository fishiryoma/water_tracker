<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="bg-blue-600 text-white p-4 shadow-md">
    <nav class="w-full sm:w-auto flex flex-col sm:flex-row gap-4 text-center sm:text-left">
      <RouterLink
        to="/target"
        class="block py-2 px-4 rounded hover:bg-blue-700 transition-colors duration-200 text-lg"
        >設定目標</RouterLink
      >
      <RouterLink
        to="/tracker"
        class="block py-2 px-4 rounded hover:bg-blue-700 transition-colors duration-200 text-lg"
        >喝水紀錄</RouterLink
      >
    </nav>
  </header>

  <RouterView />
</template>

<style scoped></style>
