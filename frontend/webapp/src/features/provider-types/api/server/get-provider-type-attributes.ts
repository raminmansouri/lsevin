
import "server-only";

import { ApiReturnType } from "@/types/network";

import { getProviderType, providerTypeProblem } from "../../db/provider-types.repository";
import { ProviderTypeAttributesResponse } from "../../types/provider-type";

export const getProviderTypeAttributes = async (
  providerTypeId: string
): Promise<ApiReturnType<ProviderTypeAttributesResponse>> => {
  try {
    const providerType = await getProviderType(providerTypeId);
    if (!providerType) {
      return {
        data: undefined,
        error: { title: "Not found", detail: "Provider type was not found.", status: 404 },
      } as ApiReturnType<ProviderTypeAttributesResponse>;
    }

    return {
      data: {
        providerTypeId: providerType.id,
        providerTypeName: providerType.name?.translations?.["en-US"] ?? providerType.name?.translations?.en ?? "",
        attributes: providerType.attributeDefinitions.map((attribute) => ({
          id: attribute.id,
          name: attribute.name?.translations?.["en-US"] ?? attribute.name?.translations?.en ?? "",
          description: attribute.description?.translations?.["en-US"] ?? attribute.description?.translations?.en ?? "",
          attributeType: String(attribute.attributeType),
          isRequired: attribute.isRequired,
          options: attribute.options?.map((option) => ({
            displayName: option.displayName?.translations?.["en-US"] ?? option.displayName?.translations?.en ?? "",
            value: option.value?.translations?.["en-US"] ?? option.value?.translations?.en ?? "",
          })),
        })),
      },
      error: undefined,
    } as ApiReturnType<ProviderTypeAttributesResponse>;
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) } as ApiReturnType<ProviderTypeAttributesResponse>;
  }
};
