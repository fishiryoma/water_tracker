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

// LINE Login 相關配置
const lineChannelId = defineString('LINE_CHANNEL_ID', {
  description: 'LINE Login Channel ID',
})

const lineChannelSecret = defineString('LINE_CHANNEL_SECRET', {
  description: 'LINE Login Channel Secret',
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
  // LINE Login 相關資料
  email?: string
  lineLoginUserId?: string
  accessToken?: string
  refreshToken?: string
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
        lastActiveAt: userData.lastActiveAt,
        isActive: true,
        ...(userData.displayName && { displayName: userData.displayName }),
        ...(userData.pictureUrl && { pictureUrl: userData.pictureUrl }),
        ...(userData.statusMessage && { statusMessage: userData.statusMessage }),
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

      if (!tokenValue || !secretValue) {
        console.error('❌ LINE Bot secrets are missing!')
        res.status(500).send('❌ Server configuration error')
        return
      }
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
      // const useLineValid = validateSignature(requestBody, secretValue, signature)
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
            }

            // 儲存到數據庫
            await saveUserToDatabase(userData)

            // 發送歡迎訊息
            const welcomeMessage: Message = {
              type: 'text',
              text: `🎉 歡迎加入！${profile?.displayName || '朋友'}\n\n我是您的專屬助手，每天都會為您提供個人化的服務。\n\n如果您想要更完整的體驗，歡迎使用 LINE 登入功能來連結您的帳戶！`,
            }

            if (event.replyToken && event.replyToken !== '00000000000000000000000000000000') {
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
              userMessage.toLowerCase().includes('登入') ||
              userMessage.toLowerCase().includes('login')
            ) {
              // 生成 LINE Login URL
              const channelId = lineChannelId.value()
              const redirectUri = encodeURIComponent('https://liff.line.me/2007574485-nVKgAdK9') // 替換為您的網域
              const state = crypto.randomBytes(16).toString('hex')
              const nonce = crypto.randomBytes(16).toString('hex')

              // 儲存 state 和 nonce 到數據庫以供驗證
              await db.ref(`auth_states/${state}`).set({
                lineUserId: userId,
                nonce: nonce,
                createdAt: new Date().toISOString(),
              })

              const loginUrl =
                `https://access.line.me/oauth2/v2.1/authorize?` +
                `response_type=code&` +
                `client_id=${channelId}&` +
                `redirect_uri=${redirectUri}&` +
                `state=${state}&` +
                `scope=profile%20openid%20email&` +
                `nonce=${nonce}`

              replyMessage = {
                type: 'text',
                text: `🔐 LINE 登入\n\n請點擊以下連結來連結您的 LINE 帳戶：\n${loginUrl}\n\n完成登入後，您就能享受完整的個人化服務！`,
              }
            } else {
              // 一般回覆
              replyMessage = {
                type: 'text',
                text: `收到您的訊息：「${userMessage}」\n\n💡 小提示：輸入「登入」可以連結您的 LINE 帳戶，獲得更好的服務體驗！`,
              }
            }

            if (event.replyToken && event.replyToken !== '00000000000000000000000000000000') {
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

// --- LINE Login 回調處理 ---
export const lineAuthCallback = onRequest(
  {
    region: 'asia-east1',
    memory: '256MiB',
    timeoutSeconds: 60,
    invoker: 'public',
  },
  async (req, res): Promise<void> => {
    console.log('=== LINE Login 回調處理 ===')

    const { code, state, error } = req.query

    if (error) {
      console.error('❌ LINE Login 錯誤:', error)
      res.status(400).send('❌ 登入失敗')
      return
    }

    if (!code || !state) {
      console.error('❌ 缺少必要參數')
      res.status(400).send('❌ 缺少必要參數')
      return
    }

    try {
      const db = getDatabase()

      // 驗證 state
      const authStateRef = db.ref(`auth_states/${state}`)
      const authStateSnapshot = await authStateRef.once('value')
      const authState = authStateSnapshot.val()

      if (!authState) {
        console.error('❌ 無效的 state')
        res.status(400).send('❌ 無效的登入請求')
        return
      }

      const { lineUserId } = authState

      // 清除 state（一次性使用）
      await authStateRef.remove()

      // 交換 access token
      const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: 'https://water-record.firebaseapp.com/__/auth/handler', // 替換為您的網域
          client_id: lineChannelId.value(),
          client_secret: lineChannelSecret.value(),
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error('❌ Token 交換失敗:', tokenData)
        res.status(400).send('❌ Token 交換失敗')
        return
      }

      // 獲取用戶資料
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      const profileData = await profileResponse.json()

      if (!profileResponse.ok) {
        console.error('❌ 獲取用戶資料失敗:', profileData)
        res.status(400).send('❌ 獲取用戶資料失敗')
        return
      }

      // 更新數據庫中的用戶資料
      const userRef = db.ref(`users/${lineUserId}`)
      await userRef.update({
        email: profileData.email,
        lineLoginUserId: profileData.userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        lastActiveAt: new Date().toISOString(),
      })

      console.log(`✅ 用戶 ${lineUserId} LINE Login 成功`)

      // 發送成功通知
      const successMessage: Message = {
        type: 'text',
        text: `🎉 LINE 登入成功！\n\n您的帳戶已成功連結，現在可以享受完整的個人化服務了！`,
      }

      const lineClient = new Client({
        channelAccessToken: channelAccessToken.value(),
        channelSecret: channelSecret.value(),
      })

      await lineClient.pushMessage(lineUserId, successMessage)

      res.status(200).send(`
        <html>
          <head><title>登入成功</title></head>
          <body>
            <h1>🎉 登入成功！</h1>
            <p>您的 LINE 帳戶已成功連結，請回到聊天室查看確認訊息。</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `)
    } catch (error) {
      console.error('❌ LINE Login 回調處理失敗:', error)
      res.status(500).send('❌ 服務器錯誤')
    }
  },
)
