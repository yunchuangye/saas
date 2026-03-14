"use client";

import { trpc } from "@/lib/trpc";

export function useReports(opts: { status?: string; page?: number } = {}) {
  return trpc.reports.list.useQuery(
    { page: opts.page ?? 1, pageSize: 20, status: opts.status },
    { staleTime: 2 * 60 * 1000 }
  );
}

export function useReport(id: number) {
  return trpc.reports.get.useQuery({ id }, { enabled: !!id });
}

export function useCreateReport() {
  const utils = trpc.useUtils();
  return trpc.reports.create.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
    },
  });
}

export function useUpdateReport() {
  const utils = trpc.useUtils();
  return trpc.reports.update.useMutation({
    onSuccess: (_, variables) => {
      utils.reports.get.invalidate({ id: variables.id });
    },
  });
}

export function useSubmitReport() {
  const utils = trpc.useUtils();
  return trpc.reports.submit.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });
}

export function useReviewReport() {
  const utils = trpc.useUtils();
  return trpc.reports.review.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });
}

export function useAIReviewReport() {
  return trpc.reports.review.useMutation();
}

export function useAIAssistReport() {
  return trpc.reports.aiAssist.useMutation();
}
