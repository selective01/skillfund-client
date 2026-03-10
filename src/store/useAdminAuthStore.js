import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const useAdminAuthStore = create(
  persist(
    (set) => ({
      adminUser: null,
      adminToken: null,
      loading: false,

      // Step 1: verify email + password, trigger OTP send
      requestOtp: async (email, password) => {
        set({ loading: true });
        try {
          const res = await axios.post(`${BASE}/admin/auth/request-otp`, { email, password });
          set({ loading: false });
          return { success: true, message: res.data.message };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.message || "Request failed" };
        }
      },

      // Step 2: verify OTP, receive token + user
      verifyOtp: async (email, otp) => {
        set({ loading: true });
        try {
          const res = await axios.post(`${BASE}/admin/auth/verify-otp`, { email, otp });
          set({ adminUser: res.data.user, adminToken: res.data.token, loading: false });
          return { success: true };
        } catch (err) {
          set({ loading: false });
          return { success: false, message: err.response?.data?.message || "Invalid OTP" };
        }
      },

      logout: () => set({ adminUser: null, adminToken: null }),
    }),
    {
      name: "admin-auth",
      partialize: (s) => ({ adminUser: s.adminUser, adminToken: s.adminToken }),
    }
  )
);

export default useAdminAuthStore;
