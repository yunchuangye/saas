"use client";

import { trpc } from "@/lib/trpc";

export function useProjects(opts: { status?: string; page?: number; pageSize?: number; search?: string } = {}) {
  return trpc.projects.list.useQuery(
    { page: opts.page ?? 1, pageSize: opts.pageSize ?? 20, status: opts.status, search: opts.search },
    { staleTime: 2 * 60 * 1000 }
  );
}

export function useBiddingProjects(page: number = 1) {
  return trpc.projects.listBidding.useQuery({ page, pageSize: 20 });
}

export function useActiveProjects(page: number = 1) {
  return trpc.projects.listActive.useQuery({ page, pageSize: 20 });
}

export function useCompletedProjects(page: number = 1) {
  return trpc.projects.listCompleted.useQuery({ page, pageSize: 20 });
}

export function useProject(id: number) {
  return trpc.projects.get.useQuery({ id }, { enabled: !!id });
}

export function useCreateProject() {
  const utils = trpc.useUtils();
  return trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });
}

export function useSubmitBid() {
  const utils = trpc.useUtils();
  return trpc.bids.submit.useMutation({
    onSuccess: () => {
      utils.bids.listByOrg.invalidate();
    },
  });
}

export function useBidsByProject(projectId: number) {
  return trpc.bids.listByProject.useQuery({ projectId }, { enabled: !!projectId });
}

export function useBidsByOrg(page: number = 1) {
  return trpc.bids.listByOrg.useQuery({ page, pageSize: 20 });
}
