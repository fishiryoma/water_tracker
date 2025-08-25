export const zh = {
  welcome: (displayName?: string) =>
    `歡迎加入！ようこそ！${displayName || ''}\n\n"JP" を入力して日本語に切り替え\n輸入 "TW" 切換成中文💓\n\n請點擊下方連結，完成帳戶連結\nリンクをクリックして、LINEアカウントを連携しましょう\nhttps://water-record.web.app/`,
  login: `🔐 LINE 登入\n\n請點擊以下連結來連結您的 LINE 帳戶：\nhttps://water-record.web.app/\n\n💡 "JP" を入力して日本語に切り替え\n輸入 "TW" 切換成中文💓`,
  generalReply: (totalDrank: number) =>
    `🔺今日已喝${totalDrank}mL🤩💓🥛繼續加油唷😘\n\n💡 輸入「登入」可以連結視覺化網站跟 LINE 帳戶！\n🧑‍💻 輸入一個數字就可以自動幫你紀錄喝水量唷！`,
  replayTotalDrink: (totalDrank: number) => `🔺今日已喝${totalDrank}mL🤩💓`,
  loginKeywords: ['登入', 'login', 'ログイン'],
  langSwitched: '✅ 語言已切換為中文。',
}
