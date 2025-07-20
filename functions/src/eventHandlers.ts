import { UserData } from './types'
import { getUserProfile, saveUser, updateUserActivity, replyMessage, getDrinkData } from './utils'
import {
  createWelcomeMessage,
  createLoginMessage,
  createGeneralReply,
  replayTotalDrink,
  isLoginMessage,
} from './messages'

/**
 * 處理用戶加入事件
 */
export async function handleFollowEvent(event: any, accessToken: string, secret: string) {
  const userId = event.source.userId
  console.log(`✅ 用戶 ${userId} 加入了 LINE Bot`)

  try {
    // 獲取用戶資料
    const profile = await getUserProfile(userId, accessToken)

    // 準備用戶資料
    const userData: UserData = {
      lineUserId: userId,
      displayName: profile?.displayName,
      pictureUrl: profile?.pictureUrl,
      statusMessage: profile?.statusMessage,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isActive: true,
      waterTarget: 1000,
    }

    // 儲存到數據庫
    await saveUser(userData)

    // 發送歡迎訊息
    if (event.replyToken) {
      const welcomeMessage = createWelcomeMessage(profile?.displayName)
      await replyMessage(event.replyToken, welcomeMessage, accessToken, secret)
      console.log(`✅ 成功發送歡迎訊息給用戶 ${userId}`)
    }

    return { success: true, userId, message: 'user_joined' }
  } catch (error) {
    console.error(`❌ 處理 follow 事件時發生未預期錯誤:`, error)
    return { success: false, userId, message: 'user_join_failed', error: error.message }
  }
}

/**
 * 處理用戶離開事件
 */
export async function handleUnfollowEvent(event: any) {
  const userId = event.source.userId
  console.log(`❌ 用戶 ${userId} 離開了 LINE Bot`)

  try {
    await updateUserActivity(userId, false)
    return { success: true, userId, message: 'user_left' }
  } catch (error) {
    console.error(`❌ 處理 unfollow 事件失敗:`, error)
    return { success: false, userId, message: 'user_left_failed', error: error.message }
  }
}

/**
 * 處理文字訊息事件
 */
export async function handleTextMessage(event: any, accessToken: string, secret: string) {
  const userId = event.source.userId
  const userMessage = event.message.text
  console.log(`✅ 收到來自 ${userId} 的訊息: "${userMessage}"`)

  const drinkAmount = Number(userMessage.trim())
  try {
    const drinkData = await getDrinkData(userId)
    const drinkUpdate = !isNaN(drinkAmount) && drinkAmount < drinkData.waterTarget

    // 更新用戶活動時間
    if (drinkUpdate) {
      await updateUserActivity(userId, true, drinkAmount, drinkData.totalDrank)
    } else {
      await updateUserActivity(userId, true)
    }

    // 準備回覆訊息
    let replyMsg
    if (isLoginMessage(userMessage)) {
      replyMsg = createLoginMessage()
    } else if (drinkUpdate) {
      replyMsg = replayTotalDrink(drinkData.totalDrank, drinkAmount)
    } else {
      replyMsg = createGeneralReply(drinkData.totalDrank)
    }

    if (event.replyToken) {
      await replyMessage(event.replyToken, replyMsg, accessToken, secret)
      console.log(`✅ 成功回覆用戶 ${userId}`)
    }

    return { success: true, userId, message: 'replied' }
  } catch (error) {
    console.error(`❌ 處理文字訊息事件失敗:`, error)
    return { success: false, userId, message: 'text_message_failed', error: error.message }
  }
}
