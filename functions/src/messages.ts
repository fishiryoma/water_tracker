import { Message } from '@line/bot-sdk'
import { zh } from './locales/zh'
import { ja } from './locales/ja'

const messages = { zh, ja }
type SupportedLang = keyof typeof messages

// 根據語言代碼取得對應的文字庫，預設為中文
function getLocale(lang?: string) {
  const languageCode = lang?.split('-')[0] as SupportedLang // 'zh-TW' -> 'zh'
  return messages[languageCode] || messages.zh
}

/**
 * 生成歡迎訊息
 */
export function createWelcomeMessage(displayName?: string): Message {
  return {
    type: 'text',
    text: zh.welcome(displayName),
  }
}

/**
 * 生成登入指引訊息
 */
export function createLoginMessage(lang?: string): Message {
  const t = getLocale(lang)
  return {
    type: 'text',
    text: t.login,
  }
}

/**
 * 生成一般回覆訊息
 */
export function createGeneralReply(totalDrank: number, lang?: string): Message {
  const t = getLocale(lang)
  return {
    type: 'text',
    text: t.generalReply(totalDrank),
  }
}

/**
 * 回覆喝水總量
 */
export function replayTotalDrink(totalDrank: number, lang?: string): Message {
  const t = getLocale(lang)
  return {
    type: 'text',
    text: t.replayTotalDrink(totalDrank),
  }
}

/**
 * 檢查是否為登入相關訊息
 */
export function isLoginMessage(message: string): boolean {
  // 檢查所有語言的關鍵字，讓用戶用任何一種語言都能觸發
  const allKeywords = [...zh.loginKeywords, ...ja.loginKeywords]
  const uniqueKeywords = new Set(allKeywords.map((k) => k.toLowerCase()))
  return uniqueKeywords.has(message.toLowerCase().trim())
}

/**
 * 生成語言切換確認訊息
 */
export function createLangSwitchMessage(lang: string): Message {
  const t = getLocale(lang)
  return {
    type: 'text',
    text: t.langSwitched,
  }
}
