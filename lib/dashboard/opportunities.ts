import type { Opportunity } from "./types"

export type OpportunityStatus = "all" | "active" | "tender" | "sold" | "rejected"

export function isRejectedOpportunity(item: Opportunity) {
  return /отказ/i.test(item.note ?? "")
}

export function isTenderOpportunity(item: Opportunity) {
  return /тендер/i.test(item.note ?? "")
}

export function isActiveOpportunity(item: Opportunity) {
  return !item.sold && !isRejectedOpportunity(item)
}

export function matchesOpportunityStatus(item: Opportunity, status: OpportunityStatus) {
  if (status === "active") return isActiveOpportunity(item)
  if (status === "tender") return isTenderOpportunity(item) && !isRejectedOpportunity(item)
  if (status === "sold") return item.sold
  if (status === "rejected") return isRejectedOpportunity(item)
  return true
}

export function summarizeOpportunities(items: Opportunity[]) {
  const eligible = items.filter((item) => !isRejectedOpportunity(item))
  const tender = eligible.filter(isTenderOpportunity)
  const sold = eligible.filter((item) => item.sold)
  const active = eligible.filter(isActiveOpportunity)

  return {
    total: summarizeAmount(eligible),
    tender: summarizeAmount(tender),
    sold: summarizeAmount(sold),
    active: summarizeAmount(active),
  }
}

function summarizeAmount(items: Opportunity[]) {
  const known = items.filter((item): item is Opportunity & { amount: number } => item.amount !== null)
  return {
    amount: known.length ? known.reduce((sum, item) => sum + item.amount, 0) : null,
    count: items.length,
    missingAmountCount: items.length - known.length,
  }
}
