import { UserData } from './types'
import {
  getUserProfile,
  saveUser,
  updateUserActivity,
  replyMessage,
  getDrinkData,
  getUser,
  updateUserLanguage,
} from './utils'
import {
  createWelcomeMessage,
  createLoginMessage,
  createGeneralReply,
  replayTotalDrink,
  isLoginMessage,
  createLangSwitchMessage,
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
      displayName: profile?.displayName || '未設定',
      pictureUrl: profile?.pictureUrl || '未設定',
      statusMessage: profile?.statusMessage || '未設定',
      language: profile?.language, // 保存用戶語言
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
  const userMessage = event.message.text.toUpperCase().trim()
  console.log(`✅ 收到來自 ${userId} 的訊息: "${userMessage}"`)

  try {
    // 語言切換邏輯
    if (userMessage === 'TW' || userMessage === 'JP') {
      const lang = userMessage === 'TW' ? 'zh-TW' : 'ja'
      const result = await updateUserLanguage(userId, lang)
      if (result) {
        const replyMsg = createLangSwitchMessage(lang)
        await replyMessage(event.replyToken, replyMsg, accessToken, secret)
        console.log(`✅ 已為用戶 ${userId} 切換語言為 ${lang}`)
        return { success: true, userId, message: 'language_switched' }
      }
    }

    // 獲取用戶和飲水數據
    const userData = await getUser(userId)
    const userLang = userData?.language
    const drinkData = await getDrinkData(userId, userLang)

    const isNumber = Number(userMessage.trim())
    const drinkAmount = isNumber && isNumber > 0 ? isNumber : NaN
    const drinkUpdate =
      !isNaN(drinkAmount) && drinkAmount < drinkData.waterTarget - drinkData.totalDrank

    // 更新用戶活動時間
    if (drinkUpdate) {
      await updateUserActivity(userId, true, drinkAmount, drinkData.totalDrank, userLang)
    } else {
      await updateUserActivity(userId, true)
    }

    // 準備回覆訊息
    let replyMsg
    if (isLoginMessage(userMessage)) {
      replyMsg = createLoginMessage(userLang)
    } else if (drinkUpdate) {
      replyMsg = replayTotalDrink(drinkData.totalDrank + drinkAmount, userLang)
    } else {
      replyMsg = createGeneralReply(drinkData.totalDrank, userLang)
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
