import { MonthYear } from "./monthYear";
// @ts-nocheck
import dayjs from "dayjs";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "../../../axiosInstance";
import { queryKeys } from "../../../react-query/constants";
import { useUser } from "../../user/hooks/useUser";
import { AppointmentDateMap } from "../types";
import { getAvailableAppointments } from "../utils";
import { getMonthYearDetails, getNewMonthYear } from "./monthYear";

// for useQuery call
async function getAppointments(
  year: string,
  month: string
): Promise<AppointmentDateMap> {
  const { data } = await axiosInstance.get(`/appointments/${year}/${month}`);
  return data;
}

// types for hook return object
interface UseAppointments {
  appointments: AppointmentDateMap;
  monthYear: MonthYear;
  updateMonthYear: (monthIncrement: number) => void;
  showAll: boolean;
  setShowAll: Dispatch<SetStateAction<boolean>>;
}

// 이 훅의 사용 용도:
//   1. 사용자의 현재 월과 연도를 추적하는 것 (aka monthYear)
//     1a. 사용자가 버튼을 통해 달력 년월을 이동할 때 마다 monthYear 업데이트
//   2. 데이터 제공을 위해 해당 monthYear에 대한 appointments를 반환해야함
//     2a. AppointmentDateMap 형식으로 반환 (appointment arrays indexed by day of month)
//     2b. 해당 monthYear의 이전 달과 다음 달의 appointments를 preFetching함
//   3. 필터의 상태를 추적함
//     3a. return the only the applicable appointments for the current monthYear
export function useAppointments(): UseAppointments {
  const queryClient = useQueryClient();
  const currentMonthYear = getMonthYearDetails(dayjs());
  const [monthYear, setMonthYear] = useState(currentMonthYear);

  function updateMonthYear(monthIncrement: number): void {
    setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
  }

  const [showAll, setShowAll] = useState(false);
  const { user } = useUser();

  const selectFn = useCallback(
    (data) => getAvailableAppointments(data, user),
    [user]
  );

  useEffect(() => {
    const nextMonthYear = getNewMonthYear(monthYear, 1);
    queryClient.prefetchQuery(
      [queryKeys.appointments, nextMonthYear.year, nextMonthYear.month],
      () => getAppointments(nextMonthYear.year, nextMonthYear.month)
    );
  }, [monthYear, queryClient]);

  const fallback = {};

  const { data: appointments = fallback } = useQuery(
    [queryKeys.appointments, monthYear.year, monthYear.month],
    () => getAppointments(monthYear.year, monthYear.month),
    {
      select: showAll ? undefined : selectFn,
    }
  );

  return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
}
