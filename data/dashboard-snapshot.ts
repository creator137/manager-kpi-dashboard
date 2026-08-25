import type { DashboardRecord, DashboardSnapshot, KpiKey } from "@/lib/dashboard/types"

const managers = ["Алексей Ладьин", "Анастасия Маслихова", "Дарья Степанова"]
const periods = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август"]

const salesHistory: Array<[string, string, number, number | null]> = [
  ["Январь", managers[0], 6_000_000, 12_635_121], ["Январь", managers[1], 6_000_000, 1_220_500], ["Январь", managers[2], 1_266_000, 210_000],
  ["Февраль", managers[0], 9_000_000, 10_481_095], ["Февраль", managers[1], 9_000_000, 10_193_410], ["Февраль", managers[2], 1_500_000, 180_000],
  ["Март", managers[0], 12_000_000, null], ["Март", managers[1], 12_000_000, 9_688_128], ["Март", managers[2], 3_000_000, 217_500],
  ["Апрель", managers[0], 8_000_000, 0], ["Апрель", managers[1], 8_000_000, 13_650_915], ["Апрель", managers[2], 4_500_000, 14_088_175],
  ["Май", managers[0], 15_000_000, 1_977_300], ["Май", managers[1], 15_000_000, 46_535_162], ["Май", managers[2], 7_000_000, 39_545_984],
  ["Июнь", managers[0], 11_000_000, 2_730_000], ["Июнь", managers[1], 11_000_000, 6_311_820], ["Июнь", managers[2], 8_000_000, 218_000],
  ["Июль", managers[0], 12_500_000, 351_000], ["Июль", managers[1], 12_500_000, 10_759_350], ["Июль", managers[2], 10_000_000, 7_687_720],
  ["Август", managers[0], 12_500_000, 0], ["Август", managers[1], 12_500_000, 19_786_567.8], ["Август", managers[2], 10_000_000, 0],
]

const activity: Array<[string, KpiKey, number, number]> = [
  [managers[0], "calls", 310, 64], [managers[0], "newMeetings", 8, 1], [managers[0], "proposals", 24, 3], [managers[0], "salesCount", 5, 0],
  [managers[1], "calls", 20, 132], [managers[1], "newMeetings", 9, 2], [managers[1], "proposals", 17, 39], [managers[1], "salesCount", 5, 8],
  [managers[2], "calls", 20, 69], [managers[2], "newMeetings", 8, 1], [managers[2], "proposals", 17, 6], [managers[2], "salesCount", 5, 0],
]

const historicalActivity: DashboardRecord[] = []
const pushMetric = (kpi: KpiKey, period: string, plans: number[], facts: number[]) => {
  managers.forEach((manager, index) => historicalActivity.push({ period, manager, kpi, plan: plans[index], fact: facts[index] }))
}

pushMetric("calls", "Январь", [310, 20, 20], [43, 20, 6])
pushMetric("calls", "Февраль", [310, 20, 20], [37, 24, 19])
pushMetric("calls", "Март", [310, 20, 20], [60, 52, 10])
pushMetric("calls", "Апрель", [310, 20, 20], [0, 13, 0])
pushMetric("calls", "Май", [310, 20, 20], [233, 147, 39])
pushMetric("calls", "Июнь", [310, 20, 20], [234, 129, 124])
pushMetric("calls", "Июль", [310, 20, 20], [292, 138, 120])

pushMetric("salesCount", "Январь", [2, 5, 5], [2, 14, 0])
pushMetric("salesCount", "Февраль", [9, 5, 5], [0, 7, 1])
pushMetric("salesCount", "Март", [3, 5, 5], [3, 9, 0])
pushMetric("salesCount", "Апрель", [5, 5, 5], [0, 22, 0])
pushMetric("salesCount", "Май", [5, 5, 5], [1, 18, 2])
pushMetric("salesCount", "Июнь", [5, 5, 5], [3, 4, 2])
pushMetric("salesCount", "Июль", [5, 5, 5], [1, 5, 2])

pushMetric("newMeetings", "Апрель", [8, 9, 8], [1, 2, 0])
pushMetric("newMeetings", "Май", [8, 9, 8], [3, 3, 3])
pushMetric("newMeetings", "Июнь", [8, 9, 8], [3, 1, 7])
pushMetric("newMeetings", "Июль", [8, 9, 8], [4, 0, 5])

pushMetric("proposals", "Март", [24, 17, 17], [15, 27, 8])
pushMetric("proposals", "Апрель", [24, 17, 17], [0, 0, 0])
pushMetric("proposals", "Май", [24, 17, 17], [20, 62, 8])
pushMetric("proposals", "Июнь", [24, 17, 17], [10, 30, 16])
pushMetric("proposals", "Июль", [24, 17, 17], [16, 28, 9])

const records: DashboardRecord[] = [
  ...salesHistory.map(([period, manager, plan, fact]) => ({ period, manager, kpi: "revenue" as const, plan, fact })),
  ...historicalActivity,
  ...activity.map(([manager, kpi, plan, fact]) => ({ period: "Август", manager, kpi, plan, fact })),
]

export const dashboardSnapshot: DashboardSnapshot = {
  source: "snapshot",
  sourceLabel: "Google Sheets · read-only snapshot",
  asOf: "2026-08-25T13:00:00+05:00",
  periods,
  managers,
  records,
  opportunities: [
    { period: "Август", company: "MR Orion 3", project: "Элерон", manager: managers[1], amount: 5_000_000, sold: false },
    { period: "Август", company: "MR Group", project: "Ситизен", manager: managers[1], amount: 4_600_000, sold: false },
    { period: "Август", company: "ССК", project: "Корсаков", manager: managers[2], amount: 0, sold: true, dealUrl: "https://virtualland.megaplan.ru/deals/8885/card/" },
    { period: "Август", company: "ССК", project: "Включи", manager: managers[2], amount: 4_374_392, sold: true, dealUrl: "https://virtualland.megaplan.ru/deals/8592/card/" },
    { period: "Август", company: "Capital group", project: "Мастерс, ЦОП", manager: managers[0], amount: 7_000_000, sold: false },
    { period: "Август", company: "Capital alliance", project: "Гурзуф, первый проект", manager: managers[0], amount: 12_000_000, sold: false, note: "Обновить статус" },
    { period: "Август", company: "ФСК", project: "ЖК Амбер сити", manager: managers[0], amount: 7_000_000, sold: false, note: "Предварительное согласие" },
    { period: "Август", company: "Capital group", project: "МИГ 5 и 6 ЦОП", manager: managers[0], amount: 83_000_000, sold: false, note: "Сумма выросла: КРТ" },
    { period: "Август", company: "ГК Родина", project: "Проект SVL", manager: managers[0], amount: 13_000_000, sold: false, note: "Тендер" },
    { period: "Август", company: "ПИК", project: "Шкиперский 19", manager: managers[1], amount: 10_155_600, sold: false, note: "Тендер / отказ" },
  ],
  meetings: [
    { manager: managers[1], date: "2026-08-14", dateLabel: "14.08.2026", time: "12.00", company: "Неометрия", project: "МЖК, Чекменева", dealUrls: ["https://virtualland.megaplan.ru/deals/7940/card/"], nasUrl: "https://virtualland.synology.me:5001/" },
    { manager: managers[1], date: "2026-08-19", dateLabel: "19.08.2026", time: "15.30", company: "DOGMA", project: "EVO", dealUrls: ["https://virtualland.megaplan.ru/deals/9039/card/"], nasUrl: "https://virtualland.synology.me:5001/" },
    { manager: managers[1], date: "2026-08-21", dateLabel: "21.08.2026", time: "11.00", company: "MR Group", project: "VEER & SET", dealUrls: ["https://virtualland.megaplan.ru/deals/9183/card/"], nasUrl: "https://gofile.me/7fXZU/RXpRQGTQx", status: "Техническая встреча" },
  ],
}
