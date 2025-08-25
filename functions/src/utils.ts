import { UserData } from './types'
import { Message, Client, Profile } from '@line/bot-sdk'
import { db } from './config'

const getTodayDateForUser = (lang?: string): string => {
  const formatter = new Intl.DateTimeFormat(lang, {
    timeZone: lang === 'ja' ? 'Asia/Tokyo' : 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

/**
 * 獲取用戶 LINE 資料
 */
export async function getUserProfile(userId: string, accessToken: string): Promise<Profile | null> {
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
 * 從資料庫獲取用戶資料
 */
export async function getUser(userId: string): Promise<UserData | null> {
  try {
    const userRef = db.ref(`users/${userId}`)
    const snapshot = await userRef.once('value')
    if (snapshot.exists()) {
      return snapshot.val() as UserData
    }
    return null
  } catch (error) {
    console.error(`❌ 從資料庫獲取用戶 ${userId} 資料失敗:`, error)
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
 * 更新用戶語言
 */
export async function updateUserLanguage(userId: string, lang: string): Promise<boolean> {
  try {
    await db
      .ref(`users/${userId}`)
      .update({ language: lang, lastActiveAt: new Date().toISOString(), isActive: true })
    console.log(`✅ 用戶 ${userId} 語言已更新為 ${lang}`)
    return true
  } catch (error) {
    console.error(`❌ 更新用戶 ${userId} 語言失敗:`, error)
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
  lang?: string,
): Promise<boolean> {
  try {
    const today = getTodayDateForUser(lang)
    if (drinkAmount) {
      await db.ref(`users/${userId}`).update({
        lastActiveAt: new Date().toISOString(),
        isActive,
        [`dailyRecords/${today}/logs/${Date.now()}`]: drinkAmount,
        [`dailyRecords/${today}/totalDrank`]: totalDrank + drinkAmount,
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
  lang?: string,
): Promise<{ waterTarget: number; totalDrank: number }> {
  let waterTarget = 1000
  let totalDrank = 0
  try {
    const today = getTodayDateForUser(lang)
    const snapshot = await db.ref(`users/${userId}`).get()
    if (snapshot.exists()) {
      const userData = snapshot.val()
      waterTarget = +(userData?.waterTarget ?? 1000)
      totalDrank = +(userData?.dailyRecords?.[today]?.totalDrank ?? 0)
    }
    return { waterTarget, totalDrank }
  } catch (error) {
    console.error('取得今日已喝水量失敗')
    return { waterTarget, totalDrank }
  }
}
