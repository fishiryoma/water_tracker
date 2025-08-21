import { createRouter, createWebHistory } from 'vue-router'
import TargetSetting from '@/views/TargetSetting.vue'
import Login from '@/views/Login.vue'
import { auth } from '@/firebase'
import { updateUserData } from '@/hooks/useUpdateUser'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      auth,
      (user) => {
        removeListener()
        resolve(user)
      },
      reject,
    )
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/target',
      name: 'target',
      component: TargetSetting,
      meta: { requiresAuth: true },
    },
    {
      path: '/tracker',
      name: 'tracker',
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/WaterTracker.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/clender',
      name: 'clender',
      component: () => import('@/views/MonthClender.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/weekIntake/:date',
      name: 'weekIntake',
      component: () => import('@/views/IntakeChart.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'login',
      component: Login,
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const currentUser = await getCurrentUser()
  if (requiresAuth) {
    // if (currentUser) {
    //   await updateUserData(currentUser as User)
    next()
    // } else {
    //   next({ name: 'login' })
    // }
  } else if (to.name === 'login' && currentUser) {
    next({ name: 'tracker' })
  } else {
    // 如果路由不需要驗證，則直接允許導航
    console.log('不需要驗證的路由，允許導航')
    next()
  }
})

export default router
