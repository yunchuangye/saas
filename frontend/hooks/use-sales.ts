"use client"
import { trpc } from "@/lib/trpc"

// ── 通用 ──────────────────────────────────────
export function useSalesOverview() {
  return trpc.sales.getMyOverview.useQuery()
}
export function useSalesMarketData(cityId?: number) {
  return trpc.sales.getMarketData.useQuery({ cityId })
}
export function useTrackLead() {
  return trpc.sales.trackLead.useMutation()
}

// ── 个人客户 ──────────────────────────────────
export function useCustomerInviteCode() {
  return trpc.sales.customer_getInviteCode.useQuery()
}
export function useCustomerInviteStats() {
  return trpc.sales.customer_getInviteStats.useQuery()
}
export function useCustomerGroupBuying() {
  return trpc.sales.customer_getGroupBuying.useQuery()
}
export function useCustomerJoinGroup() {
  return trpc.sales.customer_joinGroupBuying.useMutation()
}
export function useCustomerShareCard(valuationId: number | null) {
  return trpc.sales.customer_getShareCard.useQuery(
    { valuationId: valuationId! },
    { enabled: valuationId !== null }
  )
}

// ── 评估公司 ──────────────────────────────────
export function useAppraiserMicrosite() {
  return trpc.sales.appraiser_getMicrosite.useQuery()
}
export function useAppraiserPosterTemplates() {
  return trpc.sales.appraiser_getPosterTemplates.useQuery()
}
export function useAppraiserGeneratePoster() {
  return trpc.sales.appraiser_generatePoster.useMutation()
}
export function useAppraiserCampaigns() {
  return trpc.sales.appraiser_getCampaigns.useQuery()
}
export function useAppraiserLeads(page = 1) {
  return trpc.sales.appraiser_getLeads.useQuery({ page, pageSize: 20 })
}
export function useAppraiserIssueCoupon() {
  return trpc.sales.appraiser_issueCoupon.useMutation()
}

// ── 银行机构 ──────────────────────────────────
export function useBankLoanCalculatorConfig() {
  return trpc.sales.bank_getLoanCalculatorConfig.useQuery()
}
export function useBankGenerateMarketReport() {
  return trpc.sales.bank_generateMarketReport.useMutation()
}
export function useBankCoMarketingCampaigns() {
  return trpc.sales.bank_getCoMarketingCampaigns.useQuery()
}
export function useBankCreateCoMarketing() {
  return trpc.sales.bank_createCoMarketing.useMutation()
}
export function useBankDashboard() {
  return trpc.sales.bank_getDashboard.useQuery()
}

// ── 投资机构 ──────────────────────────────────
export function useInvestorPitchbooks() {
  return trpc.sales.investor_getPitchbooks.useQuery()
}
export function useInvestorGeneratePitchbook() {
  return trpc.sales.investor_generatePitchbook.useMutation()
}
export function useInvestorGenerateNewsletter() {
  return trpc.sales.investor_generateInsightNewsletter.useMutation()
}
export function useInvestorCreateProjectInvite() {
  return trpc.sales.investor_createProjectInvite.useMutation()
}
export function useInvestorDashboard() {
  return trpc.sales.investor_getDashboard.useQuery()
}
