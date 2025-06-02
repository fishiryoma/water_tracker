import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { WebhookEvent, validateSignature, Message, Client } from '@line/bot-sdk'
import { defineString } from 'firebase-functions/params'
import * as crypto from 'crypto'

// Firebase Functions v2 的正確配置方式：使用 defineString
const channelAccessToken = defineString('LINE_TOKEN', {
  description: 'LINE Bot Channel Access Token',
})

const channelSecret = defineString('LINE_SECRET', {
  description: 'LINE Bot Channel Secret',
})

// --- 1. 初始化 Firebase Admin SDK (必須) ---
initializeApp()

// 自定義簽名驗證函數 (用於除錯)
function debugValidateSignature(body: string, signature: string, secret: string): boolean {
  console.log('=== 簽名驗證除錯 ===')
  console.log('Body type:', typeof body)
  console.log('Body length:', body.length)
  console.log('Body preview:', body.substring(0, 100) + (body.length > 100 ? '...' : ''))
  console.log('Signature:', signature)
  console.log('Secret length:', secret.length)
  console.log('Secret preview:', secret.substring(0, 10) + '...')

  try {
    // 手動計算簽名
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
    const expectedSignature = `${hash}`

    console.log('Expected signature:', expectedSignature)
    console.log('Received signature:', signature)
    console.log('Signatures match:', expectedSignature === signature)

    // 也測試 LINE SDK 的驗證
    const sdkResult = validateSignature(body, signature, secret)
    console.log('LINE SDK validation result:', sdkResult)

    return expectedSignature === signature
  } catch (error) {
    console.error('簽名計算錯誤:', error)
    return false
  }
}

// --- 4. LINE Bot Webhook 處理函式 ---
export const lineWebhook = onRequest(
  {
    region: 'asia-east1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 5,
    // 重要：確保原始 body 能被正確處理
    invoker: 'public',
  },
  async (req, res): Promise<void> => {
    console.log('=== LINE Webhook 開始處理 ===')
    console.log('Request method:', req.method)
    console.log('Content-Type:', req.headers['content-type'])
    console.log('User-Agent:', req.headers['user-agent'])
    console.log('Request headers:', JSON.stringify(req.headers, null, 2))

    // a. 檢查環境變數是否正確載入
    let tokenValue: string
    let secretValue: string

    try {
      tokenValue = channelAccessToken.value()
      secretValue = channelSecret.value()

      console.log('Token exists:', !!tokenValue)
      console.log('Secret exists:', !!secretValue)

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

    // b. 檢查請求方法
    if (req.method !== 'POST') {
      console.log('非 POST 請求，回傳 webhook 狀態')
      res.status(200).json({
        message: 'LINE Bot webhook is ready',
        method: req.method,
        timestamp: new Date().toISOString(),
      })
      return
    }

    // c. 取得並檢查簽名
    const signature = req.headers['x-line-signature'] as string
    console.log('Signature header exists:', !!signature)
    console.log('Signature value:', signature)

    if (!signature) {
      console.warn('❌ 缺少 x-line-signature header')
      res.status(401).send('❌ Missing signature')
      return
    }

    // d. 處理 request body
    console.log('=== Request Body 分析 ===')
    console.log('req.body type:', typeof req.body)
    console.log('req.body is array:', Array.isArray(req.body))
    console.log('req.body keys:', Object.keys(req.body || {}))
    console.log('req.body:', JSON.stringify(req.body, null, 2))

    // 重要：確保 body 轉換正確
    let requestBody: string

    if (typeof req.body === 'string') {
      requestBody = req.body
      console.log('Body is already string')
    } else if (typeof req.body === 'object') {
      requestBody = JSON.stringify(req.body)
      console.log('Body converted from object to string')
    } else {
      console.error('❌ Unexpected body type:', typeof req.body)
      res.status(400).send('❌ Invalid request body')
      return
    }

    console.log('Final request body length:', requestBody.length)
    console.log('Final request body preview:', requestBody.substring(0, 200))

    // e. 簽名驗證 (詳細除錯版本)
    console.log('=== 開始簽名驗證 ===')

    try {
      const isValidSignature = debugValidateSignature(requestBody, signature, secretValue)

      if (!isValidSignature) {
        console.warn('❌ 簽名驗證失敗')

        // 額外的除錯信息
        console.log('=== 除錯信息 ===')
        console.log('是否來自 LINE:', req.headers['user-agent']?.includes('LineBotWebhook'))
        console.log('Content-Type 正確:', req.headers['content-type'] === 'application/json')

        // 嘗試不同的 body 處理方式
        const alternatives = [req.body, JSON.stringify(req.body), JSON.stringify(req.body, null, 0)]

        alternatives.forEach((alt, index) => {
          const altStr = typeof alt === 'string' ? alt : JSON.stringify(alt)
          const hash = crypto
            .createHmac('sha256', secretValue)
            .update(altStr, 'utf8')
            .digest('base64')
          const altSignature = `sha256=${hash}`
          console.log(`Alternative ${index} signature:`, altSignature)
          console.log(`Alternative ${index} matches:`, altSignature === signature)
        })

        res.status(401).send('❌ Invalid signature')
        return
      }

      console.log('✅ 簽名驗證成功')
    } catch (signatureError) {
      console.error('❌ 簽名驗證過程出錯:', signatureError)
      res.status(500).send('❌ Signature validation error')
      return
    }

    // f. 處理事件 (簡化版本，專注於簽名問題)
    const events: WebhookEvent[] = req.body.events || []
    console.log('✅ 成功接收事件數量:', events.length)

    if (events.length === 0) {
      console.log('沒有事件需要處理')
      res.status(200).send('OK - No events')
      return
    }

    const processResults = await Promise.allSettled(
      events.map(async (event, index) => {
        console.log(`處理事件 ${index + 1}/${events.length}, 類型: ${event.type}`)

        try {
          // --- 處理文字訊息事件 ---
          if (event.type === 'message' && event.message.type === 'text') {
            const userId = event.source.userId
            const userMessage = event.message.text
            console.log(`✅ 收到來自 ${userId} 的訊息: "${userMessage}"`)

            // 準備一個簡單的回覆訊息
            const replyMessage: Message = {
              type: 'text',
              text: `LINE Bot 測試成功！Tess痛哭流涕!!!您的訊息是: "${userMessage}"`,
            }

            // 如果有 replyToken (表示這是用戶發送的訊息事件)，則回覆訊息
            if (event.replyToken && event.replyToken !== '00000000000000000000000000000000') {
              try {
                const lineClient = new Client({
                  channelAccessToken: tokenValue,
                  channelSecret: secretValue,
                })

                await lineClient.replyMessage(event.replyToken, replyMessage)
                console.log(`✅ 成功回覆用戶 ${userId}`)
                return { success: true, userId, message: 'replied' }
              } catch (replyError) {
                console.error(`❌ 回覆用戶 ${userId} 失敗:`, replyError)
                throw replyError
              }
            } else {
              console.warn(`事件沒有有效的 replyToken，無法回覆用戶 ${userId}`)
              return { success: true, userId, message: 'no_reply_token' }
            }
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

    if (failed > 0) {
      console.error('失敗的事件詳情:')
      processResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`事件 ${index + 1} 失敗:`, result.reason)
        }
      })
    }

    console.log('=== LINE Webhook 處理完成 ===')
    res.status(200).send('OK')
  },
)
