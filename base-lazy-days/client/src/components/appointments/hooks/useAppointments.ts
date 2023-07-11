// @ts-nocheck
import dayjs from "dayjs";
import { Dispatch, SetStateAction, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { axiosInstance } from "../../../axiosInstance";
import { queryKeys } from "../../../react-query/constants";
import { useUser } from "../../user/hooks/useUser";
import { AppointmentDateMap } from "../types";
import { getAvailableAppointments } from "../utils";
import { getMonthYearDetails, getNewMonthYear, MonthYear } from "./monthYear";

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
  /** ****************** START 1: 기본으로 유지되는 monthYear 상태*********************** */
  // 현재 날짜의 monthYear(기본 monthYear 상태의 경우)를 가져옵니다
  const currentMonthYear = getMonthYearDetails(dayjs());

  // 현재 월을 추적할 상태사용자가 선택한 연도
  // 후크 반환 개체에서 상태 값이 반환됨
  const [monthYear, setMonthYear] = useState(currentMonthYear);

  // setter는 사용자가 보기에서 월을 변경할 때 monthYear obj 상태를 업데이트합니다,
  // 후크 반환 개체에서 반환됨
  function updateMonthYear(monthIncrement: number): void {
    setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
  }
  /** ****************** END 1: monthYear state ************************* */
  /** ****************** START 2: 모든 예약 / 특정 예약 표시를 위한 필터  ****************** */
  // 모두 또는 사용 가능한 항목만 표시하도록 약속 필터링 상태 및 기능
  const [showAll, setShowAll] = useState(false);

  // 가져온 함수 getAvailableAppenments가 여기에 필요합니다
  // Available Appointments(사용 가능한 약속)를 얻으려면 사용자가 합격해야 합니다
  // 로그인한 사용자가 예약한 약속(흰색)
  const { user } = useUser();

  /** ****************** END 2: filter appointments  ******************** */
  /** ****************** START 3: useQuery  ***************************** */
  // 현재 월의 예약에 대해 쿼리 호출 사용

  // TODO: useQuery로 업데이트합니다!
  // 참고:
  // 1. 약속은 약속 날짜 맵(월일이 포함된 개체)입니다
  // 속성으로, 그리고 그날의 약속 배열을 값으로)
  //
  // 2. getAppenments 쿼리 함수에는 monthYear가 필요합니다. 년 월
  const fallback = {};

  const { data: appointments = fallback } = useQuery(
    [queryKeys.appointments, monthYear.year, monthYear.month],
    () => getAppointments(monthYear.year, monthYear.month)
  );

  /** ****************** END 3: useQuery  ******************************* */

  return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
}
