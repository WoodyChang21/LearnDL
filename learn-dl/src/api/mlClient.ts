import axios from "axios";

const DEFAULT_ML_API_URL = "http://localhost:8000/model_api";

const getMlApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_ML_API_URL?.trim() || DEFAULT_ML_API_URL;

  if (!import.meta.env.DEV) {
    return configuredUrl;
  }

  try {
    const proxyPath = new URL(configuredUrl).pathname.replace(/\/$/, "");
    return proxyPath || "/model_api";
  } catch {
    return "/model_api";
  }
};

const mlClient = axios.create({
  baseURL: getMlApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default mlClient;
