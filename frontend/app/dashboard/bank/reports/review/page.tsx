import { ReportReviewList } from "@/components/dashboard/report-review-list"

export default function BankReportReviewPage() {
  return (
    <ReportReviewList
      title="报告审核"
      description="待审核的评估报告，请仔细阅读后进行审核"
      detailBasePath="/dashboard/bank/reports"
      showReviewActions={true}
    />
  )
}
