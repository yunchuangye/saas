"use client";

import { trpc } from "@/lib/trpc";

export function useAutoValuations(page: number = 1) {
  return trpc.valuation.list.useQuery({ page, pageSize: 20 });
}

export function useAutoValuation(id: number) {
  return trpc.valuation.get.useQuery({ id }, { enabled: !!id });
}

export function useCreateValuation() {
  const utils = trpc.useUtils();
  return trpc.valuation.create.useMutation({
    onSuccess: () => {
      utils.valuation.list.invalidate();
    },
  });
}

export function useMarketAnalysis() {
  return trpc.valuation.marketAnalysis.useMutation();
}

export function useCities() {
  return trpc.directory.cities.list.useQuery(
    { pageSize: 200 },
    { staleTime: 60 * 60 * 1000 } // 1小时缓存
  );
}

export function useEstates(cityId?: number) {
  return trpc.directory.estates.list.useQuery(
    { cityId, pageSize: 100 },
    { enabled: true, staleTime: 10 * 60 * 1000 }
  );
}

export function useCases(opts: {
  cityId?: number;
  estateId?: number;
  page?: number;
  search?: string;
} = {}) {
  return trpc.directory.cases.list.useQuery({
    cityId: opts.cityId,
    estateId: opts.estateId,
    page: opts.page ?? 1,
    pageSize: 20,
    search: opts.search,
  });
}

export function useAIAnomalyDetect() {
  return trpc.directory.cases.aiAnomalyDetect.useMutation();
}

export function useAIMatchCases(input: { area: number; cityId?: number; estateId?: number; propertyType?: string; rooms?: number }) {
  return trpc.directory.cases.aiMatch.useQuery(input, { enabled: input.area > 0 });
}

export function useAIPredictPrice() {
  return trpc.directory.cases.aiPredict.useMutation();
}
