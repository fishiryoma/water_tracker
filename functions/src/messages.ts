import { Message } from '@line/bot-sdk'

/**
 * 生成歡迎訊息
 */
export function createWelcomeMessage(displayName?: string): Message {
  return {
    type: 'text',
    text: `🎉 歡迎加入！${displayName || '朋友'}\n\n多喝水沒事沒事多喝水\n\n 趕快連結您的 LINE 帳戶！\n\nhttps://water-record.web.app/`,
  }
}

/**
 * 生成登入指引訊息
 */
export function createLoginMessage(): Message {
  return {
    type: 'text',
    text: `🔐 LINE 登入\n\n請點擊以下連結來連結您的 LINE 帳戶：\nhttps://water-record.web.app/`,
  }
}

/**
 * 生成一般回覆訊息
 */
export function createGeneralReply(totalDrank: number): Message {
  return {
    type: 'text',
    text: `🔺今日已喝${totalDrank}mL🤩💓🥛繼續加油唷😘\n\n💡 輸入「登入」可以連結視覺化網站跟 LINE 帳戶！\n🧑‍💻 輸入一個數字就可以自動幫你紀錄喝水量唷！`,
  }
}

/**
 * 回覆喝水總量
 */
export function replayTotalDrink(totalDrank: number): Message {
  return {
    type: 'text',
    text: `🔺今日已喝${totalDrank}mL🤩💓`,
  }
}

/**
 * 檢查是否為登入相關訊息
 */
export function isLoginMessage(message: string): boolean {
  return (
    message.includes('登入') ||
    message.toLowerCase().includes('login') ||
    message.includes('ログイン')
  )
}
