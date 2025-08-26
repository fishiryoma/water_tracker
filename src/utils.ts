import dayjs from 'dayjs'

/**
 * 格式化日期為使用者時區
 */
export const formatDateToUserTimeZone = (date: Date): string => {
  // 1. 取得使用者的精確時區
  const userTimeZone = dayjs.tz.guess()

  // 2. 將輸入的日期物件轉換為該時區的時間
  const localTime = dayjs(date).tz(userTimeZone)

  // 3. 以 YYYY-MM-DD 的格式輸出
  return localTime.format('YYYY-MM-DD')
}

/**
 * 取得使用者時區的今天日期
 */
export const getTodayDateForUser = (): string => {
  return formatDateToUserTimeZone(new Date())
}

/**
 * 取得 7 個日期字串
 */
export const getWeekDates = (wholeWeek: boolean = false, date?: string): string[] => {
  const today = date ? dayjs(date) : dayjs()
  const dayWithTimeZone = today.tz(dayjs.tz.guess())
  const dayOfWeek = dayWithTimeZone.day() // 0 = Sunday
  const sunday = dayWithTimeZone.startOf('week')

  const dates: string[] = []
  for (let i = 0; i < (wholeWeek ? 6 : dayOfWeek) + 1; i++) {
    const d = sunday.add(i, 'day')
    dates.push(d.format('YYYY-MM-DD'))
  }
  return dates
}

/**
 * 將日期字串轉換為包含狀態的物件
 */
export const weekStatus = (
  dates: string[],
  todayStr: string = getTodayDateForUser(),
): { date: string; status: string; finished: boolean | null }[] => {

  return dates.map((date) => ({
    date,
    status: date === todayStr ? 'today' : 'pass',
    finished: null,
  }))
}

export const generateMonthDates = (year: number, month: number): string[] => {
  const daysInMonth = new Date(year, month, 0).getDate() // month 是 1~12
  const todayStr = getTodayDateForUser()
  const dates: string[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // 只加入今天及以前的日期
    if (dateStr <= todayStr) {
      dates.push(dateStr)
    }
  }
  return dates
}
