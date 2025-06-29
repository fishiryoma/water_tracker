// 更新用戶資料
import { database } from '@/firebase'
import { ref as dbRef, update } from 'firebase/database'
import { useUserIdStore } from '@/stores/userId'
import type { User } from 'firebase/auth'

export const updateUserData = async (user: User) => {
  const { setUserId } = useUserIdStore()
  const userId = user.providerData[0]?.uid
  if (userId) {
    setUserId(userId)
    try {
      await update(dbRef(database, `users/${userId}`), {
        lastActiveAt: new Date().toISOString(),
      })
      console.log('用戶資料更新成功')
    } catch (error) {
      console.error('更新用戶資料失敗:', error)
    }
  }
}
