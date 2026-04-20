import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
  CUSTOMER_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { addAllFilterParams, addAllParams } from "@/lib/filter-params";
import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";
import { getGetPickedLocationsTag } from "../../db/cache";
import sql from "@/config/database/db";


export interface GetPickedLocationsResponse{
id, locationid, image, latitude, longitude
}

export interface GetPickedLocationsFilterParams extends FilterParams{

}
 
export const getGetPickedLocations = async (
  request: BaseRequest,
  params?: GetPickedLocationsFilterParams
): Promise<GetPickedLocationsResponse> => {
  "use cache: remote";
  console.log('server GetPickedLocations called:')

  cacheTag(getGetPickedLocationsTag());
  cacheLife("default");



    const pickedLocations= await sql`
      SELECT id, locationid, image, latitude, longitude
	FROM category.picked_locations;
    `

  return pickedLocations;
};
