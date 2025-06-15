<template>
  <div ref="bgContainer" class="relative bg-pink-200/50 overflow-hidden h-screen">
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'

const bgContainer = ref(null)
let intervalId = null
onMounted(() => {
  // upgrade: 增加花瓣類型, 飄動軌跡更自然

  function createPetal() {
    const petal = document.createElement('div')
    petal.classList.add('sakura')

    if (bgContainer.value) {
      petal.style.left = Math.random() * bgContainer.value.offsetWidth + 'px'
    } else {
      petal.style.left = Math.random() * window.innerWidth + 'px'
    }
    petal.style.animationDuration = 5 + Math.random() * 5 + 's'
    petal.style.opacity = Math.random()

    if (bgContainer.value) {
      bgContainer.value.appendChild(petal)
    }

    setTimeout(() => {
      petal.remove()
    }, 10000)
  }

  intervalId = setInterval(() => {
    createPetal()
  }, 300)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style>
.sakura {
  position: absolute;
  top: -50px;
  width: 36px;
  height: 36px;
  background-image: url('../assets/petal.png');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  animation: fall linear infinite;
  z-index: 0;
}

@keyframes fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0.2;
  }
}
</style>
