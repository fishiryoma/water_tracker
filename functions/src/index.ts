import { onSchedule } from 'firebase-functions/v2/scheduler'
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { Client, Message } from '@line/bot-sdk'
import * as functions from 'firebase-functions'

// 初始化 Firebase Admin
initializeApp()

// LINE Bot 設定 - 使用 v1 的 config 方式
const lineConfig = {
  channelAccessToken: functions.config().linebot.channel_access_token,
  channelSecret: functions.config().linebot.channel_secret,
}

const lineClient = new Client(lineConfig)

const getTodayDate = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// =========================================================
// 排程通知 Cloud Function (v2 版本)
// 這是一個每天中午 12 點會執行的函式
// =========================================================
export const scheduledWaterReminder = onSchedule(
  {
    schedule: '0 12 * * *', // Cron 定義：每天中午 12 點
    timeZone: 'Asia/Taipei', // 指定時區，確保排程符合台灣時間
    region: 'asia-east1', // 建議使用亞洲區域以降低延遲
  },
  async (event) => {
    console.log('排程喝水提醒函式已啟動！', event.scheduleTime)

    const db = getDatabase()
    const todayDate = getTodayDate()

    try {
      // 步驟 1: 從 Realtime Database 讀取所有用戶的目標和紀錄
      // 假設您的使用者資料結構是 users/{userId}/waterTarget 和 users/{userId}/dailyRecords/{date}/totalDrank
      // 如果您的專案是單一用戶的，您可以簡化結構，例如：
      // waterTarget: 2000
      // dailyRecords: { '2025-05-24': { totalDrank: 1000 } }

      // 這裡假設我們只處理一個用戶的簡單情況，使用者 ID 硬編碼為 'user1' (實際應用中需要動態獲取)
      // 或者更簡單，如果您的目標和喝水量是全局的，沒有多用戶概念：
      const waterTargetSnapshot = await db.ref('waterTarget').once('value')
      const dailyRecordSnapshot = await db.ref(`dailyRecords/${todayDate}/totalDrank`).once('value')

      const dailyTarget = waterTargetSnapshot.val() || 0
      const todayDrank = dailyRecordSnapshot.val() || 0

      // 步驟 2: 構建 LINE 訊息
      let messageText = `💧 今日喝水提醒！\n`
      if (dailyTarget > 0) {
        const remainingWater = Math.max(0, dailyTarget - todayDrank)
        messageText += `您今天已喝水 ${todayDrank} ml。\n`
        if (remainingWater > 0) {
          messageText += `距離 ${dailyTarget} ml 的目標，還差 ${remainingWater} ml！\n`
          messageText += `繼續加油！💪`
        } else {
          messageText += `恭喜您，已達成今日喝水目標！🎉`
        }
      } else {
        messageText += `您今天已喝水 ${todayDrank} ml。\n請記得設定您的每日喝水目標喔！`
      }

      const message: Message = {
        type: 'text',
        text: messageText,
      }

      // 步驟 3: 發送訊息給用戶
      // **重點：您需要知道要發送給哪個用戶！**
      // 在這個簡單的例子中，我們需要一個或多個用戶的 LINE User ID。
      // 在實際應用中，您需要在用戶第一次與 BOT 互動時，將其 User ID 儲存到 Realtime Database 中。
      // 這裡我會用一個佔位符 'YOUR_USER_ID'，您需要替換它，或者從資料庫讀取所有用戶的 ID。

      // 從 Realtime Database 讀取用戶 ID (假設您有一個 'lineUsers' 節點儲存所有用戶 ID)
      const usersSnapshot = await db.ref('lineUsers').once('value')
      const lineUserIds: string[] = []

      if (usersSnapshot.exists()) {
        usersSnapshot.forEach((childSnapshot) => {
          lineUserIds.push(childSnapshot.key as string) // 假設節點名稱就是 User ID
        })
      }

      if (lineUserIds.length === 0) {
        console.warn('沒有找到任何 LINE User ID，無法發送提醒。')
        return
      }

      // 遍歷所有用戶並發送訊息
      for (const userId of lineUserIds) {
        try {
          await lineClient.pushMessage(userId, message)
          console.log(`訊息已成功發送給用戶: ${userId}`)
        } catch (error) {
          console.error(`發送訊息給用戶 ${userId} 失敗:`, error)
        }
      }

      // 記錄發送統計
      await db.ref('notificationLogs').push({
        timestamp: Date.now(),
        date: todayDate,
        totalUsers: lineUserIds.length,
        dailyTarget,
        todayDrank,
      })
    } catch (error) {
      console.error('排程函式執行錯誤:', error)
      throw error
    }
  },
)

// =========================================================
// LINE BOT Webhook 處理函式 (可選，但推薦用於獲取 User ID)
// 這是當用戶向您的 LINE BOT 發送訊息時會被觸發的函式
// = ========================================================
// export const lineWebhook = functions.https.onRequest(async (req, res) => {
//   const channelSecret = functions.config().linebot.channel_secret
//   const channelAccessToken = functions.config().linebot.channel_access_token
//   const lineWebhookClient = new Client({ channelAccessToken, channelSecret })

//   // 驗證請求來源，確保來自 LINE
//   const signature = req.headers["x-line-signature"] as string
//   if (!lineWebhookClient.validateSignature(req.rawBody, signature)) {
//     return res.status(401).send("Invalid signature")
//   }

//   const events = req.body.events
//   functions.logger.info("LINE Webhook events:", events)

//   // 處理每個事件
//   await Promise.all(
//     events.map(async (event: any) => {
//       if (event.type === "message" && event.message.type === "text") {
//         const userId = event.source.userId
//         const userMessage = event.message.text

//         functions.logger.info(`收到來自 ${userId} 的訊息: ${userMessage}`)

//         // 將用戶 ID 儲存到 Realtime Database (如果不存在的話)
//         const userRef = admin.database().ref(`lineUsers/${userId}`)
//         await userRef.set(true) // 簡單地將 User ID 作為鍵，值設為 true

//         // 回覆用戶 (可選)
//         const replyMessage: Message = {
//           type: "text",
//           text: `您好！您的 LINE User ID (${userId}) 已記錄。您將會收到每日喝水提醒。`,
//         }
//         await lineWebhookClient.replyMessage(event.replyToken, replyMessage)
//       }
//     }),
//   )

//   res.status(200).send("OK")
// })
