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
 * 取得本週的 7 個日期字串
 */
export const getWeekDay = () => {
  const today = new Date()

  // 計算本週的週日
  const dayOfWeek = today.getDay() // 0 = Sunday
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - dayOfWeek)

  // 產生本週的到今日的日期字串
  const weekDates: { date: string; status: string; finished: boolean | null }[] = []
  for (let i = 0; i < dayOfWeek + 1; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    weekDates.push({
      date: d.toISOString().slice(0, 10),
      status: i === dayOfWeek ? 'today' : 'pass',
      finished: null,
    })
  }

  return weekDates
}
