import axios from "axios"
import { getAuth } from "firebase/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
})

api.interceptors.request.use(async (config) => {
  const existingAuthorization =
    config.headers?.Authorization ??
    config.headers?.authorization ??
    (typeof config.headers?.has === "function" &&
    (config.headers.has("Authorization") || config.headers.has("authorization"))
      ? "present"
      : undefined)

  if (existingAuthorization) {
    return config
  }

  const user = getAuth().currentUser

  if (user) {
    const token = await user.getIdToken()

    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`)
    } else {
      config.headers = axios.AxiosHeaders.from(config.headers)
      config.headers.set("Authorization", `Bearer ${token}`)
    }
  }

  return config
})

export default api
