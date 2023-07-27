import { queryClient } from "./../../../react-query/queryClient";
import { AxiosResponse } from "axios";

import type { User } from "../../../../../shared/types";
import { axiosInstance, getJWTHeader } from "../../../axiosInstance";
import { queryKeys } from "../../../react-query/constants";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "../../../user-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

async function getUser(user: User | null): Promise<User | null> {
  if (!user) return null;
  const { data }: AxiosResponse<{ user: User }> = await axiosInstance.get(
    `/user/${user.id}`,
    {
      headers: getJWTHeader(user),
    }
  );
  return data.user;
}

interface UseUser {
  user: User | null;
  updateUser: (user: User) => void;
  clearUser: () => void;
}

export function useUser(): UseUser {
  // TODO: call useQuery to update user data from server
  // const user = null;
  const queryClient = useQueryClient();
  const { data: user } = useQuery([queryKeys.user], () => getUser(user), {
    initialData: getStoredUser(),
    onSuccess: (received: User | null) => {
      if (!received) {
        clearStoredUser();
      } else {
        setStoredUser(received);
      }
    },
  });

  // meant to be called from useAuth
  function updateUser(newUser: User): void {
    setStoredUser(newUser);
    queryClient.setQueryData([queryKeys.user], newUser);
  }

  // meant to be called from useAuth
  function clearUser() {
    // TODO: reset user to null in query cache
    queryClient.setQueriesData([queryKeys.user], null);
    queryClient.removeQueries([queryKeys.appointments, queryKeys.user]);
    clearStoredUser();
  }

  return { user, updateUser, clearUser };
}
