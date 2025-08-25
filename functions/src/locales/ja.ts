export const ja = {
  login: `🔐 LINE ログイン\n\n以下のリンクをクリックしてLINEアカウントを連携しましょう：\nhttps://water-record.web.app/\n\n💡 "JP" を入力して日本語に切り替え\n輸入 "TW" 切換成中文💓`,
  generalReply: (totalDrank: number) =>
    `🔺今日の飲水量: ${totalDrank}mL🤩💓🥛この調子で頑張っていこうね😘\n\n💡 「ログイン」と入力すると、可視化サイトとLINEアカウントを連携できます！\n🧑‍💻 数字を入力すると、自動的に飲水量を記録します！`,
  replayTotalDrink: (totalDrank: number) => `🔺今日の飲水量: ${totalDrank}mL🤩💓`,
  loginKeywords: ['登入', 'login', 'ログイン'],
  langSwitched: '✅ 言語を日本語に切り替えました。',
}
