import { dashboardSnapshot } from "@/data/dashboard-snapshot"
import { GoogleSheetsProvider } from "@/lib/google-sheets/provider"
import type { DashboardDataProvider } from "./types"

export class SnapshotProvider implements DashboardDataProvider {
  async getSnapshot() {
    return dashboardSnapshot
  }
}

export async function getDashboardData() {
  if (process.env.DASHBOARD_DATA_PROVIDER === "snapshot") {
    return new SnapshotProvider().getSnapshot()
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    ?? "1UyVjJaVMZlufAZ4uWuQ9GvdCWb2xE-z-sTAm2dQcDX0"
  const provider: DashboardDataProvider = new GoogleSheetsProvider(spreadsheetId)

  try {
    return await provider.getSnapshot()
  } catch (error) {
    console.error("Live Google Sheets read failed; using the bundled snapshot", error)
    return {
      ...dashboardSnapshot,
      sourceLabel: "Google Sheets · резервный snapshot",
    }
  }
}
