/**
 * 格式化日期為台灣時區
 */
export const formatDateToTaiwan = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  return `${year}-${month}-${day}`
}

/**
 * 取得 7 個日期字串
 */
export const getWeekDates = (wholeWeek: boolean = false, date?: string): string[] => {
  const today = date ? new Date(date) : new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - dayOfWeek)

  const dates: string[] = []
  for (let i = 0; i < (wholeWeek ? 6 : dayOfWeek) + 1; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }

  return dates
}

/**
 * 將日期字串轉換為包含狀態的物件
 */
export const weekStatus = (
  dates: string[],
  todayStr: string = new Date().toISOString().slice(0, 10),
): { date: string; status: string; finished: boolean | null }[] => {
  return dates.map((date) => ({
    date,
    status: date === todayStr ? 'today' : 'pass',
    finished: null,
  }))
}

export const generateMonthDates = (year: number, month: number): string[] => {
  const daysInMonth = new Date(year, month, 0).getDate() // month 是 1~12
  const today = new Date()
  const todayStr = formatDateToTaiwan(today)
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
