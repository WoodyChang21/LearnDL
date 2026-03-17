import axios from "axios";

const mlApiBaseUrl =
  import.meta.env.VITE_ML_API_URL?.trim() || "http://localhost:8000/model_api";

const mlClient = axios.create({
  baseURL: mlApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export default mlClient;
