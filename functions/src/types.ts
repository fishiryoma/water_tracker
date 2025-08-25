// 用戶資料介面
export interface UserData {
  lineUserId: string
  displayName?: string
  pictureUrl?: string
  statusMessage?: string
  language?: string
  joinedAt: string
  lastActiveAt: string
  isActive: boolean
  waterTarget: number
}
