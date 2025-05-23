<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="">
      <nav>
        <RouterLink to="/target">設定目標</RouterLink>
        <RouterLink to="/tracker">喝水紀錄</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped></style>
