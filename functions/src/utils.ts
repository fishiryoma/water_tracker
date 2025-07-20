import * as crypto from 'crypto'
import { UserData } from './types'
import { Message, Client } from '@line/bot-sdk'
import { db } from './config'

const getTodayDate = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 驗證 LINE Webhook 簽名
 */
export function validateSignature(body: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
    return hash === signature
  } catch (error) {
    console.error('簽名計算錯誤:', error)
    return false
  }
}

/**
 * 獲取用戶 LINE 資料
 */
export async function getUserProfile(userId: string, accessToken: string) {
  try {
    const lineClient = new Client({ channelAccessToken: accessToken })
    const profile = await lineClient.getProfile(userId)
    console.log(`✅ 獲取用戶 ${userId} 的資料:`, profile)
    return profile
  } catch (error) {
    console.error(`❌ 獲取用戶 ${userId} 資料失敗:`, error)
    return null
  }
}

/**
 * 儲存/更新用戶資料
 */
export async function saveUser(userData: UserData): Promise<boolean> {
  try {
    const userRef = db.ref(`users/${userData.lineUserId}`)
    const snapshot = await userRef.once('value')

    if (snapshot.exists()) {
      await userRef.update({
        ...userData,
        lastActiveAt: userData.lastActiveAt,
        isActive: true,
      })
      console.log(`✅ 用戶 ${userData.lineUserId} 資料已更新`)
    } else {
      await userRef.set(userData)
      console.log(`✅ 新用戶 ${userData.lineUserId} 已加入`)
    }
    return true
  } catch (error) {
    console.error('❌ 儲存用戶資料失敗:', error)
    return false
  }
}

/**
 * 更新用戶活動狀態
 */
export async function updateUserActivity(
  userId: string,
  isActive: boolean = true,
  drinkAmount?: number,
  totalDrank: number = 0,
): Promise<boolean> {
  try {
    if (drinkAmount) {
      await db.ref(`users/${userId}`).update({
        lastActiveAt: new Date().toISOString(),
        isActive,
        [`dailyRecords/${getTodayDate()}/logs/${Date.now()}`]: drinkAmount,
        [`dailyRecords/${getTodayDate()}/totalDrank`]: totalDrank + drinkAmount,
      })
    } else {
      await db.ref(`users/${userId}`).update({
        lastActiveAt: new Date().toISOString(),
        isActive,
      })
    }
    return true
  } catch (error) {
    console.error(`❌ 更新用戶活動狀態失敗:`, error)
    return false
  }
}

/**
 * 發送回覆訊息
 */
export async function replyMessage(
  replyToken: string,
  message: Message,
  accessToken: string,
  secret: string,
): Promise<boolean> {
  try {
    const lineClient = new Client({
      channelAccessToken: accessToken,
      channelSecret: secret,
    })
    await lineClient.replyMessage(replyToken, message)
    console.log('✅ 訊息回覆成功')
    return true
  } catch (error) {
    console.error('❌ 訊息回覆失敗:', error)
    return false
  }
}

/**
 * 取得今日已喝水量
 */
export async function getDrinkData(
  userId: string,
): Promise<{ waterTarget: number; totalDrank: number }> {
  let waterTarget = 1000
  let totalDrank = 0
  try {
    const snapshot = await db.ref(`users/${userId}`).get()
    if (snapshot.exists()) {
      const userData = snapshot.val()
      waterTarget = +(userData?.waterTarget ?? 1000)
      totalDrank = +(userData?.dailyRecords?.[getTodayDate()]?.totalDrank ?? 0)
    }
    return { waterTarget, totalDrank }
  } catch (error) {
    console.error('取得今日已喝水量失敗')
    return { waterTarget, totalDrank }
  }
}
