import api from "./axiosClient";

type AuthMeResponse = {
  user: {
    userId: number | string;
  };
};

export const getCurrentUserId = async () => {
  const response = await api.get<AuthMeResponse>("/auth/me");
  return String(response.data.user.userId);
};
