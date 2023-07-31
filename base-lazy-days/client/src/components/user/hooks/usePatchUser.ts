import jsonpatch from "fast-json-patch";
import {
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from "@tanstack/react-query";
import type { User } from "../../../../../shared/types";
import { axiosInstance, getJWTHeader } from "../../../axiosInstance";
import { useUser } from "./useUser";
import { useCustomToast } from "../../app/hooks/useCustomToast";
import { queryKeys } from "react-query/constants";

// for when we need a server function
async function patchUserOnServer(
  newData: User | null,
  originalData: User | null
): Promise<User | null> {
  if (!newData || !originalData) return null;
  // create a patch for the difference between newData and originalData
  const patch = jsonpatch.compare(originalData, newData);

  // send patched data to the server
  const { data } = await axiosInstance.patch(
    `/user/${originalData.id}`,
    { patch },
    {
      headers: getJWTHeader(originalData),
    }
  );
  return data.user;
}

// TODO: update type to UseMutateFunction type
export function usePatchUser(): UseMutateFunction<
  User,
  unknown,
  User,
  unknown
> {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();
  const queryClient = useQueryClient();

  const { mutate: patchUser } = useMutation(
    (newUserData: User) => patchUserOnServer(newUserData, user),
    {
      // onMutate 함수는 onError 핸들러에 context를 반환함
      onMutate: async (newData: User | null) => {
        // 발신하는 모든 쿼리를 취소함, 즉 오래된 서버 데이터는 낙관적 업데이트를 덮어씌지 않음
        queryClient.cancelQueries([queryKeys.user]);
        // 기존 사용자 데이터(업데이트 하기전에 캐시에 있었던 값)의 snapshot을 찍음
        const previousUserData: User = queryClient.getQueryData([
          queryKeys.user,
        ]);
        // 새로운 값으로 캐시를 낙관적 업데이트를 함
        updateUser(newData);
        // 해당 context를 return
        return { previousUserData };
      },
      onError: (error, newData, context) => {
        // error가 있는 경우 저장된 값으로 캐시를 롤백
        if (context.previousUserData) {
          updateUser(context.previousUserData);
          toast({
            title: "Update failed; restoring previous values",
            status: "success",
          });
        }
      },
      onSuccess: (userData: User | null) => {
        if (user) {
          toast({
            title: "User updated!",
            status: "success",
          });
        }
      },
      // mutate를 resolve했을 때 성공 여부와 관계없이 onSettles 콜백을 실행
      onSettled: () => {
        // 사용자에 대한 데이터를 무효화하여 서버에서 최신 데이터를 보여줄 수 있도록 함
        queryClient.invalidateQueries([queryKeys.user]);
      },
    }
  );

  return patchUser;
}
