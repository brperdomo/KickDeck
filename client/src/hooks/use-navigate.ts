
import { useCallback } from "react";
import { useLocation } from "./use-location";

export const useNavigate = () => {
  const [, setLocation] = useLocation();
  
  return useCallback((to: string) => {
    setLocation(to);
  }, [setLocation]);
};
