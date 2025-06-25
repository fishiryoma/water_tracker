import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { WebhookEvent, Message, Client } from '@line/bot-sdk'
import { defineString } from 'firebase-functions/params'
import * as crypto from 'crypto'

// Firebase Functions v2 的配置
const channelAccessToken = defineString('LINE_TOKEN', {
  description: 'LINE Bot Channel Access Token',
})

const channelSecret = defineString('LINE_SECRET', {
  description: 'LINE Bot Channel Secret',
})

// 初始化 Firebase Admin SDK
initializeApp()

// 用戶資料介面
interface UserData {
  lineUserId: string
  displayName?: string
  pictureUrl?: string
  statusMessage?: string
  joinedAt: string
  lastActiveAt: string
  isActive: boolean
  waterTarget: number
}

// 自定義簽名驗證函數
function debugValidateSignature(body: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
    const expectedSignature = `${hash}`
    return expectedSignature === signature
  } catch (error) {
    console.error('簽名計算錯誤:', error)
    return false
  }
}

// 儲存用戶資料到 Firebase Realtime Database
async function saveUserToDatabase(userData: UserData): Promise<void> {
  try {
    const db = getDatabase()
    const userRef = db.ref(`users/${userData.lineUserId}`)

    // 檢查用戶是否已存在
    const snapshot = await userRef.once('value')
    const existingData = snapshot.val()

    if (existingData) {
      // 更新現有用戶的最後活動時間
      await userRef.update({
        ...userData,
        lastActiveAt: userData.lastActiveAt,
        isActive: true,
      })
      console.log(`✅ 用戶 ${userData.lineUserId} 資料已更新`)
    } else {
      // 新增用戶
      await userRef.set(userData)
      console.log(`✅ 新用戶 ${userData.lineUserId} 已加入數據庫`)
    }
  } catch (error) {
    console.error('❌ 儲存用戶資料失敗:', error)
    throw error
  }
}

// 獲取用戶詳細資料
async function getUserProfile(userId: string, accessToken: string): Promise<any> {
  try {
    const lineClient = new Client({
      channelAccessToken: accessToken,
    })

    const profile = await lineClient.getProfile(userId)
    console.log(`✅ 獲取用戶 ${userId} 的資料:`, profile)
    return profile
  } catch (error) {
    console.error(`❌ 獲取用戶 ${userId} 資料失敗:`, error)
    return null
  }
}

// --- LINE Bot Webhook 處理函式 ---
export const lineWebhook = onRequest(
  {
    region: 'asia-east1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 5,
    invoker: 'public',
  },
  async (req, res): Promise<void> => {
    console.log('=== LINE Webhook 開始處理 ===')

    // 檢查環境變數
    let tokenValue: string
    let secretValue: string

    try {
      tokenValue = channelAccessToken.value()
      secretValue = channelSecret.value()
    } catch (error) {
      console.error('❌ 環境變數讀取失敗:', error)
      res.status(500).send('❌ Server configuration error')
      return
    }

    // 檢查請求方法
    if (req.method !== 'POST') {
      res.status(200).json({
        message: 'LINE Bot webhook is ready',
        method: req.method,
        timestamp: new Date().toISOString(),
      })
      return
    }

    // 檢查簽名
    const signature = req.headers['x-line-signature'] as string
    if (!signature) {
      console.warn('❌ 缺少 x-line-signature header')
      res.status(401).send('❌ Missing signature')
      return
    }

    // 處理 request body
    let requestBody: string
    if (typeof req.body === 'string') {
      requestBody = req.body
    } else if (typeof req.body === 'object') {
      requestBody = JSON.stringify(req.body)
    } else {
      console.error('❌ Unexpected body type:', typeof req.body)
      res.status(400).send('❌ Invalid request body')
      return
    }

    // 簽名驗證
    try {
      const isValidSignature = debugValidateSignature(requestBody, signature, secretValue)
      if (!isValidSignature) {
        console.warn('❌ 簽名驗證失敗')
        res.status(401).send('❌ Invalid signature')
        return
      }
      console.log('✅ 簽名驗證成功')
    } catch (signatureError) {
      console.error('❌ 簽名驗證過程出錯:', signatureError)
      res.status(500).send('❌ Signature validation error')
      return
    }

    // 處理事件
    const events: WebhookEvent[] = req.body.events || []
    console.log('✅ 成功接收事件數量:', events.length)

    if (events.length === 0) {
      res.status(200).send('OK - No events')
      return
    }

    const processResults = await Promise.allSettled(
      events.map(async (event, index) => {
        console.log(`處理事件 ${index + 1}/${events.length}, 類型: ${event.type}`)

        try {
          // 處理 follow 事件（用戶加入）
          if (event.type === 'follow') {
            const userId = event.source.userId
            console.log(`✅ 用戶 ${userId} 加入了 LINE Bot`)

            // 獲取用戶資料
            const profile = await getUserProfile(userId!, tokenValue)

            // 準備用戶資料
            const userData: UserData = {
              lineUserId: userId!,
              displayName: profile?.displayName,
              pictureUrl: profile?.pictureUrl,
              statusMessage: profile?.statusMessage,
              joinedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
              isActive: true,
              waterTarget: 1000,
            }

            // 儲存到數據庫
            await saveUserToDatabase(userData)

            // 發送歡迎訊息
            const welcomeMessage: Message = {
              type: 'text',
              text: `🎉 歡迎加入！${profile?.displayName || '朋友'}\n\n多喝水沒事沒事多喝水\n\n 趕快連結您的 LINE 帳戶！\n\nhttps://water-record.web.app/`,
            }

            if (event.replyToken) {
              const lineClient = new Client({
                channelAccessToken: tokenValue,
                channelSecret: secretValue,
              })

              await lineClient.replyMessage(event.replyToken, welcomeMessage)
              console.log(`✅ 成功發送歡迎訊息給用戶 ${userId}`)
            }

            return { success: true, userId, message: 'user_joined' }
          }

          // 處理 unfollow 事件（用戶離開）
          if (event.type === 'unfollow') {
            const userId = event.source.userId
            console.log(`❌ 用戶 ${userId} 離開了 LINE Bot`)

            // 更新數據庫中的用戶狀態
            const db = getDatabase()
            await db.ref(`users/${userId}`).update({
              isActive: false,
              lastActiveAt: new Date().toISOString(),
            })

            return { success: true, userId, message: 'user_left' }
          }

          // 處理文字訊息事件
          if (event.type === 'message' && event.message.type === 'text') {
            const userId = event.source.userId
            const userMessage = event.message.text
            console.log(`✅ 收到來自 ${userId} 的訊息: "${userMessage}"`)

            // 更新用戶最後活動時間
            const db = getDatabase()
            await db.ref(`users/${userId}`).update({
              lastActiveAt: new Date().toISOString(),
              isActive: true,
            })

            // 準備回覆訊息
            let replyMessage: Message

            // 檢查是否為 LINE Login 相關指令
            if (
              userMessage.includes('登入') ||
              userMessage.toLowerCase().includes('login') ||
              userMessage.includes('ログイン')
            ) {
              replyMessage = {
                type: 'text',
                text: `🔐 LINE 登入\n\n請點擊以下連結來連結您的 LINE 帳戶：\nhttps://water-record.web.app/`,
              }
            } else {
              // 一般回覆
              replyMessage = {
                type: 'text',
                text: `收到您的訊息：「${userMessage}」\n\n💡 小提示：輸入「登入」可以連結您的 LINE 帳戶，趕快加入唷ASAP！`,
              }
            }

            if (event.replyToken) {
              const lineClient = new Client({
                channelAccessToken: tokenValue,
                channelSecret: secretValue,
              })

              await lineClient.replyMessage(event.replyToken, replyMessage)
              console.log(`✅ 成功回覆用戶 ${userId}`)
            }

            return { success: true, userId, message: 'replied' }
          } else {
            console.log(`跳過事件類型: ${event.type}`)
            return { success: true, message: 'skipped', eventType: event.type }
          }
        } catch (error) {
          console.error(`❌ 處理事件 ${index + 1} 失敗:`, error)
          throw error
        }
      }),
    )

    // 統計處理結果
    const successful = processResults.filter((result) => result.status === 'fulfilled').length
    const failed = processResults.filter((result) => result.status === 'rejected').length

    console.log(`事件處理完成: 成功 ${successful}, 失敗 ${failed}`)
    console.log('=== LINE Webhook 處理完成 ===')
    res.status(200).send('OK')
  },
)
