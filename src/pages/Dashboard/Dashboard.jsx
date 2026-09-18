import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded">
            Devotee Portal
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#900000] mt-2">
            Welcome, {user?.name || user?.firstName || "Devotee"}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Email: {user?.email || "N/A"} | Phone: {user?.phone || "N/A"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="border border-red-200 text-[#900000] hover:bg-red-50 px-5 py-2 rounded-lg text-xs font-bold transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

