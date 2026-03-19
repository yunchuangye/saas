import { ReportReviewList } from "@/components/dashboard/report-review-list"

export default function AppraiserReportReviewPage() {
  return (
    <ReportReviewList
      title="报告复核"
      description="待复核的评估报告"
      detailBasePath="/dashboard/appraiser/reports"
      showReviewActions={true}
    />
  )
}
