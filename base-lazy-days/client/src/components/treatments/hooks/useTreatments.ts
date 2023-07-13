import { queryClient } from "./../../../react-query/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Treatment } from "../../../../../shared/types";
import { axiosInstance } from "../../../axiosInstance";
import { queryKeys } from "../../../react-query/constants";

// for when we need a query function for useQuery
async function getTreatments(): Promise<Treatment[]> {
  const { data } = await axiosInstance.get("/treatments");
  return data;
}

export function useTreatments(): Treatment[] {
  // TODO: get data from server via useQuery
  const fallback = [];
  const { data = fallback } = useQuery([queryKeys.treatments], getTreatments, {
    staleTime: 6000, // 1분
    cacheTime: 30000, // 5분 (cacheTime의 기본값은 5분이고 cacheTime이 statleTime보다 짧아선 안됨)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return data;
}

export function usePrefetchTreatments(): void {
  const queryClient = useQueryClient();
  queryClient.prefetchQuery([queryKeys.treatments], getTreatments);
}
