import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import axios from "axios"
import api from "../api/axiosClient"
import { auth } from "./firebase"

export interface AuthUser {
  id: string
  name: string | null
  email: string
  firebaseUid: string
}

interface BackendAuthResponse {
  user: AuthUser
}

const SIGNUP_IN_PROGRESS_KEY = "auth.signupInProgress"

const setSignupInProgress = (isInProgress: boolean) => {
  if (typeof window === "undefined") {
    return
  }

  if (isInProgress) {
    window.sessionStorage.setItem(SIGNUP_IN_PROGRESS_KEY, "true")
    return
  }

  window.sessionStorage.removeItem(SIGNUP_IN_PROGRESS_KEY)
}

export const isSignupInProgress = () => {
  if (typeof window === "undefined") {
    return false
  }

  return window.sessionStorage.getItem(SIGNUP_IN_PROGRESS_KEY) === "true"
}

const getAuthorizationHeader = async (user: User, forceRefresh = false) => {
  const token = await user.getIdToken(forceRefresh)

  return {
    Authorization: `Bearer ${token}`,
  }
}

export const loginUser = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const res = await api.post<BackendAuthResponse>("/auth/login", null, {
    headers: await getAuthorizationHeader(credential.user),
  })

  return res.data
}

export const signupUser = async (
  name: string,
  email: string,
  password: string
) => {
  setSignupInProgress(true)
  let shouldSignOut = false

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    shouldSignOut = true

    if (name.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() })
    }

    const res = await api.post<{ message: string; user: AuthUser }>(
      "/auth/register",
      null,
      {
        headers: await getAuthorizationHeader(credential.user, true),
      }
    )

    return res.data
  } finally {
    if (shouldSignOut) {
      await signOut(auth)
    }

    setSignupInProgress(false)
  }
}

export const getCurrentUser = async () => {
  try {
    const res = await api.post<BackendAuthResponse>("/auth/login")

    return res.data.user
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }

    throw error
  }
}

export const logoutUser = async () => {
  await signOut(auth)
}

export const waitForAuthUser = () =>
  new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
