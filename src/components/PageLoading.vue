<template>
  <div v-if="isLoading" class="flex items-center justify-center w-full h-[300px]">
    <LoadingSpinner
      :show="true"
      spinClass="w-10 h-10"
      textClass="text-lg"
      :message="$t('LOADING.DEFAULT')"
      layout="vertical"
    />
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from '@/components/LoadingSpinner.vue'

defineProps<{ isLoading: boolean }>()
</script>
