import { useState, useRef } from "react";
import { Phone } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { ENV_CONFIG } from "../../../constants/envConfig";
import {
  useGetContactSettings,
  useSubmitContactForm,
  useGetStates,
  useGetCities,
  useGetRegards,
} from "../../../hooks/queries/Footer/useGetContactUs";
import { APP_COLORS } from "../../../constants/appColors";

const baseFieldClasses =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/30 transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";

const FormInput = (props) => <input className={baseFieldClasses} {...props} />;

const FormSelect = ({ children, ...props }) => (
  <select
    className={`${baseFieldClasses} ${!props.disabled ? "cursor-pointer text-gray-700" : "text-gray-400"}`}
    {...props}
  >
    {children}
  </select>
);

const FormTextarea = (props) => (
  <textarea className={`${baseFieldClasses} resize-none`} {...props} />
);

export const ContactUs = () => {
  // 1. Data & Mutations
  const { data: contactInfo, isLoading: isInfoLoading } =
    useGetContactSettings();
  const { mutateAsync: submitForm, isPending: isSubmitting } =
    useSubmitContactForm();

  const primaryColor = APP_COLORS?.primary || "#900000";

  // Local Form State & Security State
  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    zipcode: "",
    regardingTypes: "",
    message: "",
  });

  const { data: states } = useGetStates();
  const { data: cities, isLoading: isCitiesLoading } = useGetCities(
    formData.state,
  );
  const { data: regards } = useGetRegards();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      // If the state changes, clear city
      if (name === "state") {
        updatedData.city = "";
      }
      return updatedData;
    });
  };

  const handleClear = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      city: "",
      zipcode: "",
      regardingTypes: "",
      message: "",
    });

    // Reset CAPTCHA visually and structurally
    if (recaptchaRef.current) recaptchaRef.current.reset();
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      alert("Please complete the reCAPTCHA verification before submitting.");
      return;
    }
    try {
      await submitForm(formData);
      alert("Thank you! Your message has been sent successfully.");
      handleClear();
    } catch {
      alert("Failed to send message. Please try again.");
    }
  };

  if (isInfoLoading) {
    return (
      <section className="w-full min-h-screen py-16 lg:py-24 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 animate-pulse">
          <div className="lg:col-span-5 h-[700px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8" />
          <div className="lg:col-span-7 h-[700px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
      <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 w-full flex flex-col h-full">
          <div className="bg-white p-8 md:p-10 lg:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100/60 relative overflow-hidden h-full flex flex-col">
            <div
              className="absolute top-0 left-0 w-full h-1.5"
              style={{ backgroundColor: primaryColor }}
            />

            <h2
              className="text-3xl lg:text-4xl font-extrabold font-serif mb-10 tracking-tight"
              style={{ color: primaryColor }}
            >
              For More Information
            </h2>

            <div className="space-y-10 relative z-10 flex-1">
              {contactInfo?.map((section) => (
                <div key={section.id} className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-6 pt-2">
                    {section.contacts.map((contact, idx) => (
                      <div key={idx} className="flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-red-100">
                          <Phone
                            className="w-5 h-5"
                            style={{ color: primaryColor }}
                            fill="currentColor"
                            strokeWidth={1}
                          />
                        </div>
                        <div className="flex flex-col pt-0.5">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-base md:text-lg font-bold text-gray-900 hover:opacity-75 transition-opacity"
                          >
                            {contact.email}
                          </a>
                          <a
                            href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                            className="text-sm md:text-base font-medium text-gray-600 hover:opacity-75 transition-opacity mt-0.5"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-7 w-full flex flex-col h-full">
          <div className="bg-white p-8 md:p-10 lg:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-orange-100/60 relative overflow-hidden h-full flex flex-col">
            <div
              className="absolute top-0 left-0 w-full h-1.5"
              style={{ backgroundColor: primaryColor }}
            />

            <h2
              className="text-3xl lg:text-4xl font-extrabold font-serif mb-8 tracking-tight relative z-10"
              style={{ color: primaryColor }}
            >
              Contact Us
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 relative z-10 flex-1 flex flex-col justify-between"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name *"
                  required
                />
                <FormInput
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name *"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address *"
                  required
                />
                <FormInput
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number *"
                  required
                />
              </div>

              <FormInput
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full Address"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* State Dropdown */}
                <FormSelect
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  <option value="" disabled className="text-gray-400">
                    Select State
                  </option>
                  {states?.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </FormSelect>

                {/* City Dropdown (Locked until State is selected) */}
                <FormSelect
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!formData.state || isCitiesLoading}
                >
                  <option value="" disabled className="text-gray-400">
                    {isCitiesLoading ? "Loading cities..." : "Select City"}
                  </option>
                  {cities?.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </FormSelect>

                <FormInput
                  type="text"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleInputChange}
                  placeholder="Zipcode"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  name="regardingTypes"
                  value={formData.regardingTypes}
                  onChange={handleInputChange}
                >
                  <option value="" disabled className="text-gray-400">
                    Regarding Inquiry...
                  </option>
                  {regards?.map((regard) => (
                    <option>{regard.name}</option>
                  ))}
                </FormSelect>
              </div>

              <FormTextarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Write your comments here..."
                required
                rows="4"
              />

              <div className="flex justify-start mt-2">
                <div className="overflow-hidden">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={
                      ENV_CONFIG.VITE_RECAPTCHA_SITE_KEY ||
                      "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    }
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-8 py-3.5 bg-white border-2 hover:bg-gray-50 text-[15px] font-bold rounded-xl transition-all shadow-sm active:scale-95 text-gray-600 border-gray-200 w-full sm:w-auto"
                >
                  CLEAR FORM
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-3.5 text-white text-[15px] font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? "SUBMITTING..." : "SEND MESSAGE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
