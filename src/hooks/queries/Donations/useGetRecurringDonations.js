import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ENDPOINTS } from "../../../constants/apiConstants";
import { buildComponentConfigPayload } from "../../../utils/apiPayloadBuilder";
import { adaptServiceSetupData } from "../Services/Book_Services/useGetServices";

export const DONATIONS_CATEGORY = "DONATIONS";
export const RECURRING_DONATIONS_TYPE = "RECURRING DONATIONS";

export const useGetRecurringDonations = () => {
    return useQuery({
        queryKey: ["templeDonations", RECURRING_DONATIONS_TYPE],
        queryFn: async ({ signal }) => {
            const baseConfig = buildComponentConfigPayload({
                moduleName: "Temple Services",
                aspectType: "ServiceSetup",
                collectionType: "Business",
            });

            const payload = {
                ...baseConfig,
                componentConfig: {
                    ...baseConfig.componentConfig,
                    query: {
                        aspectType: "ServiceSetup",
                        serviceCategoryTypes: DONATIONS_CATEGORY,
                        serviceTypes: RECURRING_DONATIONS_TYPE,
                        sourceTypes: "WEBSITE",
                        status: "ACTIVE",
                    },
                    moduleName: "Temple Services",
                    aspectType: "ServiceSetup",
                    collectionType: "Business",
                    skip: 0,
                    next: 1024,
                },
            };

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
                signal,
            });

            return adaptServiceSetupData(
                response?.data || response,
                DONATIONS_CATEGORY,
            );
        },
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

export default useGetRecurringDonations;


