import api from "../api/axiosClient"

export interface AuthUser {
  id: string
  username: string
  email: string
  createdAt: string
}

interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export const loginUser = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  })

  return res.data
}

export const signupUser = async (
  username: string,
  email: string,
  password: string
) => {
  const res = await api.post<{ message: string; user: AuthUser }>("/auth/register", {
    username,
    email,
    password,
  })

  return res.data
}

export const getCurrentUser = async () => {
  const res = await api.get<{ user: AuthUser }>("/auth/me")
  return res.data.user
}

export const logoutUser = () => {
  localStorage.removeItem("accessToken")
}
