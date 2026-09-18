import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useModalStore } from "../../store/useModalStore";

export const AuthGuard = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openModal = useModalStore((state) => state.openModal);
  const location = useLocation();

  if (!isAuthenticated) {
    // Automatically trigger the Sign-In modal if they attempt to access protected pages directly
    openModal("SIGN_IN");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
