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
  salesPlan: {
    year: 2026,
    annualPlan: 333_322_608.4142364,
    months: [
      ["Январь", 13_266_409.836363636], ["Февраль", 21_016_332.78727273], ["Март", 30_696_966.066],
      ["Апрель", 25_135_050.82], ["Май", 37_273_050.82], ["Июнь", 26_014_355.902],
      ["Июль", 33_554_355.902], ["Август", 33_654_355.902], ["Сентябрь", 36_839_355.902],
      ["Октябрь", 33_610_791.4922], ["Ноябрь", 21_130_791.4922], ["Декабрь", 21_130_791.4922],
    ].map(([period, plan]) => ({ period: String(period), plan: Number(plan) })),
  },
  salesStatistics: {
    year: 2026,
    months: [
      { period: "Январь", salesPlan: 13_266_000, salesForecast: 12_000_000, salesFact: 4_011_424, assignedMeetingsPlan: 16, assignedMeetingsFact: 22, demoSvlPlan: 10, demoSvlFact: 17, demoCopPlan: 6, demoCopFact: 5, qualifiedLeads: 9, newClientMeetings: 6, newClientSales: 0, activeClientMeetings: 20, activeClientSales: 4, inactiveClientMeetings: 2, inactiveClientSales: 0, svlSold: 2, svlAverageCheck: 3_657_000, copSold: 0, copAverageCheck: null, svlUpsells: 4, svlUpsellAverageCheck: null, proposals: 17 },
      { period: "Февраль", salesPlan: 21_016_333, salesForecast: 18_000_000, salesFact: 21_350_000, assignedMeetingsPlan: 17, assignedMeetingsFact: 22, demoSvlPlan: 11, demoSvlFact: 13, demoCopPlan: 6, demoCopFact: 9, qualifiedLeads: 11, newClientMeetings: 6, newClientSales: 0, activeClientMeetings: 16, activeClientSales: 12, inactiveClientMeetings: 0, inactiveClientSales: 0, svlSold: 0, svlAverageCheck: null, copSold: 0, copAverageCheck: null, svlUpsells: 12, svlUpsellAverageCheck: null, proposals: 25 },
      { period: "Март", salesPlan: 30_696_000, salesForecast: 27_000_000, salesFact: 11_839_332, assignedMeetingsPlan: 28, assignedMeetingsFact: 25, demoSvlPlan: 15, demoSvlFact: 19, demoCopPlan: 10, demoCopFact: 9, qualifiedLeads: 7, newClientMeetings: 5, newClientSales: 2, activeClientMeetings: 18, activeClientSales: 8, inactiveClientMeetings: 2, inactiveClientSales: 0, svlSold: 1, svlAverageCheck: 5_866_000, copSold: 1, copAverageCheck: 2_795_580, svlUpsells: 8, svlUpsellAverageCheck: null, proposals: 46 },
      { period: "Апрель", salesPlan: 25_135_051, salesForecast: 31_000_000, salesFact: 25_131_000, assignedMeetingsPlan: 25, assignedMeetingsFact: 8, demoSvlPlan: 20, demoSvlFact: 5, demoCopPlan: 5, demoCopFact: 3, qualifiedLeads: 8, newClientMeetings: 4, newClientSales: 0, activeClientMeetings: 5, activeClientSales: 22, inactiveClientMeetings: 0, inactiveClientSales: 0, svlSold: 8, svlAverageCheck: 1_437_507, copSold: 1, copAverageCheck: 6_635_028, svlUpsells: 12, svlUpsellAverageCheck: null, proposals: 21 },
      { period: "Май", salesPlan: 37_273_051, salesForecast: 35_000_000, salesFact: 56_197_987, assignedMeetingsPlan: 25, assignedMeetingsFact: null, demoSvlPlan: 20, demoSvlFact: 8, demoCopPlan: 5, demoCopFact: 6, qualifiedLeads: 11, newClientMeetings: 5, newClientSales: 0, activeClientMeetings: 4, activeClientSales: 11, inactiveClientMeetings: 1, inactiveClientSales: 0, svlSold: 3, svlAverageCheck: 5_548_840, copSold: 3, copAverageCheck: 11_280_150, svlUpsells: 4, svlUpsellAverageCheck: null, proposals: 45 },
      { period: "Июнь", salesPlan: 26_014_256, salesForecast: 30_000_000, salesFact: 22_929_307, assignedMeetingsPlan: 38, assignedMeetingsFact: 15, demoSvlPlan: 26, demoSvlFact: 6, demoCopPlan: 12, demoCopFact: 11, qualifiedLeads: 39, newClientMeetings: 11, newClientSales: 0, activeClientMeetings: 8, activeClientSales: 9, inactiveClientMeetings: 1, inactiveClientSales: 1, svlSold: 0, svlAverageCheck: 0, copSold: 3, copAverageCheck: 6_051_630, svlUpsells: 7, svlUpsellAverageCheck: null, proposals: 56 },
      { period: "Июль", salesPlan: 33_554_000, salesForecast: 35_000_000, salesFact: 20_537_745, assignedMeetingsPlan: 36, assignedMeetingsFact: 16, demoSvlPlan: 18, demoSvlFact: 11, demoCopPlan: 18, demoCopFact: 3, qualifiedLeads: 10, newClientMeetings: 7, newClientSales: 0, activeClientMeetings: null, activeClientSales: null, inactiveClientMeetings: null, inactiveClientSales: null, svlSold: null, svlAverageCheck: null, copSold: null, copAverageCheck: null, svlUpsells: null, svlUpsellAverageCheck: null, proposals: null },
      { period: "Август", salesPlan: 33_654_356, salesForecast: 35_000_000, salesFact: 31_192_330, assignedMeetingsPlan: 36, assignedMeetingsFact: null, demoSvlPlan: 18, demoSvlFact: null, demoCopPlan: 18, demoCopFact: null, qualifiedLeads: null, newClientMeetings: null, newClientSales: null, activeClientMeetings: null, activeClientSales: null, inactiveClientMeetings: null, inactiveClientSales: null, svlSold: null, svlAverageCheck: null, copSold: null, copAverageCheck: null, svlUpsells: null, svlUpsellAverageCheck: null, proposals: null },
    ],
  },
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
