import { createRouter, createWebHistory } from 'vue-router'
import TargetSetting from '../views/TargetSetting.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/target',
      name: 'target',
      component: TargetSetting,
    },
    // {
    //   path: '/tracker',
    //   name: 'tracker',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

export default router
