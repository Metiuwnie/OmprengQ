import type { AuthUser, LoginInput } from "@mbg/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, loginAdmin, logoutAdmin } from "../api/auth";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

/** Query the current authenticated admin user from `GET /api/auth/me`. */
export function useAuthMe() {
  return useQuery<AuthUser | null>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });
}

/** Authenticate an admin user and hydrate the cached session query. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => loginAdmin(input),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
    },
  });
}

/** Terminate the active admin session and redirect to `/admin/login`. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ["admin"] });
      navigate("/admin/login", { replace: true });
    },
  });
}
