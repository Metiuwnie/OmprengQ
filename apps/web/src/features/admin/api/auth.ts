import type { ApiErrorResponse, AuthUser, LoginInput } from "@mbg/shared";
import { api } from "@/lib/api";

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;
    if (body.error?.message) {
      return body.error.message;
    }
  } catch {
    // Ignore non-JSON error bodies and use friendly fallback text.
  }
  return fallback;
}

/** Fetch current authenticated admin session, or null when unauthenticated (401). */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await api.api.auth.me.$get();
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Gagal memeriksa sesi masuk.");
    throw new Error(message);
  }
  const data = await response.json();
  return data.user;
}

/** Sign in with email and password; backend sets an httpOnly session cookie. */
export async function loginAdmin(input: LoginInput): Promise<AuthUser> {
  const response = await api.api.auth.login.$post({ json: input });
  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      "Gagal masuk. Periksa email dan kata sandi Anda.",
    );
    throw new Error(message);
  }
  const data = await response.json();
  return data.user;
}

/** Sign out current admin session and clear the httpOnly cookie on server. */
export async function logoutAdmin(): Promise<void> {
  const response = await api.api.auth.logout.$post();
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Gagal keluar dari sesi.");
    throw new Error(message);
  }
}
