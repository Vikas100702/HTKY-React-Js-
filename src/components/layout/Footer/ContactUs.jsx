// import { useState, useRef } from "react";
// import { Phone } from "lucide-react";
// import ReCAPTCHA from "react-google-recaptcha";
// import { ENV_CONFIG } from "../../../constants/envConfig";
// import {
//   useGetContactSettings,
//   useSubmitContactForm,
//   useGetStates,
//   useGetCities,
//   useGetRegards,
// } from "../../../hooks/queries/Footer/useGetContactUs";
// import { APP_COLORS } from "../../../constants/appColors";

// const baseFieldClasses =
//   "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/30 transition-all placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";

// const FormInput = (props) => <input className={baseFieldClasses} {...props} />;

// const FormSelect = ({ children, ...props }) => (
//   <select
//     className={`${baseFieldClasses} ${!props.disabled ? "cursor-pointer text-gray-700" : "text-gray-400"}`}
//     {...props}
//   >
//     {children}
//   </select>
// );

// const FormTextarea = (props) => (
//   <textarea className={`${baseFieldClasses} resize-none`} {...props} />
// );

// export const ContactUs = () => {
//   // 1. Data & Mutations
//   const { data: contactInfo, isLoading: isInfoLoading } =
//     useGetContactSettings();
//   const { mutateAsync: submitForm, isPending: isSubmitting } =
//     useSubmitContactForm();

//   const primaryColor = APP_COLORS?.primary || "#900000";

//   // Local Form State & Security State
//   const recaptchaRef = useRef(null);
//   const [captchaToken, setCaptchaToken] = useState(null);
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     address: "",
//     state: "",
//     city: "",
//     zipcode: "",
//     regardingTypes: "",
//     message: "",
//   });

//   const { data: states } = useGetStates();
//   const { data: cities, isLoading: isCitiesLoading } = useGetCities(
//     formData.state,
//   );
//   const { data: regards } = useGetRegards();

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => {
//       const updatedData = { ...prev, [name]: value };
//       // If the state changes, clear city
//       if (name === "state") {
//         updatedData.city = "";
//       }
//       return updatedData;
//     });
//   };

//   const handleClear = () => {
//     setFormData({
//       firstName: "",
//       lastName: "",
//       email: "",
//       phone: "",
//       address: "",
//       state: "",
//       city: "",
//       zipcode: "",
//       regardingTypes: "",
//       message: "",
//     });

//     // Reset CAPTCHA visually and structurally
//     if (recaptchaRef.current) recaptchaRef.current.reset();
//     setCaptchaToken(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!captchaToken) {
//       alert("Please complete the reCAPTCHA verification before submitting.");
//       return;
//     }
//     try {
//       await submitForm(formData);
//       alert("Thank you! Your message has been sent successfully.");
//       handleClear();
//     } catch {
//       alert("Failed to send message. Please try again.");
//     }
//   };

//   if (isInfoLoading) {
//     return (
//       <section className="w-full min-h-screen py-16 lg:py-24 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30">
//         <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 animate-pulse">
//           <div className="lg:col-span-5 h-[700px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8" />
//           <div className="lg:col-span-7 h-[700px] bg-white rounded-3xl shadow-sm border border-gray-100 p-8" />
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
//       <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
//         {/* LEFT COLUMN */}
//         <div className="lg:col-span-5 w-full flex flex-col h-full">
//           <div className="bg-white p-8 md:p-10 lg:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100/60 relative overflow-hidden h-full flex flex-col">
//             <div
//               className="absolute top-0 left-0 w-full h-1.5"
//               style={{ backgroundColor: primaryColor }}
//             />

//             <h2
//               className="text-3xl lg:text-4xl font-extrabold font-serif mb-10 tracking-tight"
//               style={{ color: primaryColor }}
//             >
//               For More Information
//             </h2>

//             <div className="space-y-10 relative z-10 flex-1">
//               {contactInfo?.map((section) => (
//                 <div key={section.id} className="space-y-5">
//                   <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">
//                     {section.title}
//                   </h3>
//                   <div className="space-y-6 pt-2">
//                     {section.contacts.map((contact, idx) => (
//                       <div key={idx} className="flex items-start gap-4 group">
//                         <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-red-100">
//                           <Phone
//                             className="w-5 h-5"
//                             style={{ color: primaryColor }}
//                             fill="currentColor"
//                             strokeWidth={1}
//                           />
//                         </div>
//                         <div className="flex flex-col pt-0.5">
//                           <a
//                             href={`mailto:${contact.email}`}
//                             className="text-base md:text-lg font-bold text-gray-900 hover:opacity-75 transition-opacity"
//                           >
//                             {contact.email}
//                           </a>
//                           <a
//                             href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
//                             className="text-sm md:text-base font-medium text-gray-600 hover:opacity-75 transition-opacity mt-0.5"
//                           >
//                             {contact.phone}
//                           </a>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="lg:col-span-7 w-full flex flex-col h-full">
//           <div className="bg-white p-8 md:p-10 lg:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-orange-100/60 relative overflow-hidden h-full flex flex-col">
//             <div
//               className="absolute top-0 left-0 w-full h-1.5"
//               style={{ backgroundColor: primaryColor }}
//             />

//             <h2
//               className="text-3xl lg:text-4xl font-extrabold font-serif mb-8 tracking-tight relative z-10"
//               style={{ color: primaryColor }}
//             >
//               Contact Us
//             </h2>

//             <form
//               onSubmit={handleSubmit}
//               className="space-y-6 relative z-10 flex-1 flex flex-col justify-between"
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <FormInput
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   placeholder="First Name *"
//                   required
//                 />
//                 <FormInput
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   placeholder="Last Name *"
//                   required
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <FormInput
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="Email Address *"
//                   required
//                 />
//                 <FormInput
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   placeholder="Phone Number *"
//                   required
//                 />
//               </div>

//               <FormInput
//                 type="text"
//                 name="address"
//                 value={formData.address}
//                 onChange={handleInputChange}
//                 placeholder="Full Address"
//               />

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* State Dropdown */}
//                 <FormSelect
//                   name="state"
//                   value={formData.state}
//                   onChange={handleInputChange}
//                 >
//                   <option value="" disabled className="text-gray-400">
//                     Select State
//                   </option>
//                   {states?.map((state) => (
//                     <option key={state.code} value={state.code}>
//                       {state.name}
//                     </option>
//                   ))}
//                 </FormSelect>

//                 {/* City Dropdown (Locked until State is selected) */}
//                 <FormSelect
//                   name="city"
//                   value={formData.city}
//                   onChange={handleInputChange}
//                   disabled={!formData.state || isCitiesLoading}
//                 >
//                   <option value="" disabled className="text-gray-400">
//                     {isCitiesLoading ? "Loading cities..." : "Select City"}
//                   </option>
//                   {cities?.map((city) => (
//                     <option key={city.name} value={city.name}>
//                       {city.name}
//                     </option>
//                   ))}
//                 </FormSelect>

//                 <FormInput
//                   type="text"
//                   name="zipcode"
//                   value={formData.zipcode}
//                   onChange={handleInputChange}
//                   placeholder="Zipcode"
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <FormSelect
//                   name="regardingTypes"
//                   value={formData.regardingTypes}
//                   onChange={handleInputChange}
//                 >
//                   <option value="" disabled className="text-gray-400">
//                     Regarding Inquiry...
//                   </option>
//                   {regards?.map((regard) => (
//                     <option>{regard.name}</option>
//                   ))}
//                 </FormSelect>
//               </div>

//               <FormTextarea
//                 name="message"
//                 value={formData.message}
//                 onChange={handleInputChange}
//                 placeholder="Write your comments here..."
//                 required
//                 rows="4"
//               />

//               <div className="flex justify-start mt-2">
//                 <div className="overflow-hidden">
//                   <ReCAPTCHA
//                     ref={recaptchaRef}
//                     sitekey={
//                       ENV_CONFIG.VITE_RECAPTCHA_SITE_KEY ||
//                       "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
//                     }
//                     onChange={(token) => setCaptchaToken(token)}
//                     onExpired={() => setCaptchaToken(null)}
//                   />
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100 mt-2">
//                 <button
//                   type="button"
//                   onClick={handleClear}
//                   className="px-8 py-3.5 bg-white border-2 hover:bg-gray-50 text-[15px] font-bold rounded-xl transition-all shadow-sm active:scale-95 text-gray-600 border-gray-200 w-full sm:w-auto"
//                 >
//                   CLEAR FORM
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="px-10 py-3.5 text-white text-[15px] font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 w-full sm:w-auto"
//                   style={{ backgroundColor: primaryColor }}
//                 >
//                   {isSubmitting ? "SUBMITTING..." : "SEND MESSAGE"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

/**
 * @file src/pages/Footer/ContactUs.jsx
 * @description Responsive, crash-resistant Contact Us page for HTKY.
 * Incorporates contact directories, enquiry submission, social media links,
 * and a responsive, lazy-loaded Google Maps embed.
 */

import { useState, useRef } from "react";
import { Phone, MapPin, ExternalLink } from "lucide-react";
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
    formData.state
  );
  const { data: regards } = useGetRegards();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
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
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* LEFT COLUMN: Contact Directory & Social */}
          <div className="lg:col-span-5 w-full flex flex-col h-full">
            <div className="bg-white p-8 md:p-10 lg:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100/60 relative overflow-hidden h-full flex flex-col justify-between">
              <div
                className="absolute top-0 left-0 w-full h-1.5"
                style={{ backgroundColor: primaryColor }}
              />

              <div>
                <h2
                  className="text-3xl lg:text-4xl font-extrabold font-serif mb-10 tracking-tight"
                  style={{ color: primaryColor }}
                >
                  For More Information
                </h2>

                <div className="space-y-10 relative z-10">
                  {contactInfo?.map((section) => (
                    <div key={section.id} className="space-y-5">
                      <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">
                        {section.title}
                      </h3>
                      <div className="space-y-6 pt-2">
                        {section.contacts.map((contact, idx) => (
                          <div
                            key={`${section.id}-${idx}`}
                            className="flex items-start gap-4 group"
                          >
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

              {/* FOLLOW US SECTION */}
              <div className="pt-10 mt-8 border-t border-gray-100">
                <h3 className="text-sm font-extrabold tracking-wider uppercase text-gray-700 mb-4">
                  FOLLOW US
                </h3>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/HinduTempleofKentucky"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    style={{ backgroundColor: primaryColor }}
                    aria-label="Visit Hindu Temple of Kentucky on Facebook"
                  >
                    f
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Contact Form */}
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
                    {regards?.map((regard, idx) => (
                      <option key={regard.name || idx} value={regard.name}>
                        {regard.name}
                      </option>
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

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100 mt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-8 py-3.5 bg-white border-2 hover:bg-gray-50 text-[15px] font-bold rounded-xl transition-all shadow-sm active:scale-95 text-gray-600 border-gray-200 w-full sm:w-auto"
                  >
                    CLEAR
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-3.5 text-white text-[15px] font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Interactive Google Map */}
        <div className="w-full mt-12 lg:mt-16">
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-orange-100/60 p-3 sm:p-4">
            <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden">
              <iframe
                title="Hindu Temple of Kentucky Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3130.8052932947794!2d-85.5444539!3d38.3071787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88699f8be7e57c6b%3A0xb36bfa6b6f790c37!2sHindu%20Temple%20of%20Kentucky!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus"
                className="w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Action pill: Open in Google Maps */}
              <div className="absolute top-4 right-4 z-10">
                <a
                  href="https://maps.app.goo.gl/TAWaRqBV4wNYU8gu7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-gray-800 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md border border-gray-200/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                >
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};