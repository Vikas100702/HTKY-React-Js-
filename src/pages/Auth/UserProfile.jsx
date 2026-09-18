import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { Loader2, CheckCircle2 } from "lucide-react";

export const UserProfile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    addressLine1: user?.addressLine1 || "",
    city: user?.city || "",
    zip: user?.zip || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      updateUserProfile(formData);
      setIsSubmitting(false);
      setSuccessMsg(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <h1 className="text-2xl font-serif font-bold text-[#900000] mb-2">
          Complete Your Profile
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          Please provide your details to personalize your temple service
          experience.
        </p>

        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-4 rounded-md mb-6 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">
              Profile updated successfully! Redirecting...
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#900000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#900000]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              name="addressLine1"
              required
              value={formData.addressLine1}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#900000]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#900000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#900000]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2 border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#900000] hover:bg-[#7a0000] text-white px-6 py-2 rounded text-xs font-bold flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
