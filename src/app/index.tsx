import axios from "axios";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import { api, clearToken, getToken } from "../lib/api";

// Opens first. Decides where to go:
//   saved token that the server accepts -> dashboard
//   no token / expired token            -> login
export default function Index() {
  const [target, setTarget] = useState<
    "/pages/dashboard" | "/auth/login" | null
  >(null);

  useEffect(() => {
    let active = true;

    const check = async () => {
      // keep the loader on screen at least 1 second so it never just flashes
      const minWait = new Promise((r) => setTimeout(r, 1000));
      let next: "/pages/dashboard" | "/auth/login" = "/auth/login";

      try {
        const token = await getToken();
        if (token) {
          await api.get("/me"); // token is valid
          next = "/pages/dashboard";
        }
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : null;

        if (status === 401 || status === 403 || status === 404) {
          // token expired / invalid / customer removed
          await clearToken();
          next = "/auth/login";
        } else {
          // server unreachable: keep the session and let the dashboard retry
          next = "/pages/dashboard";
        }
      }

      await minWait;
      if (active) setTarget(next);
    };

    check();
    return () => {
      active = false;
    };
  }, []);

  if (target) return <Redirect href={target} />;

  return <Loader />;
}
