import type { BaseRequest } from "@/types/common";
import type { FilterParams } from "@/types/filter";

import { getSponseredSliderRows } from "../../lib/sponsered-slider-db";

export const getSponseredSlider = (request: Partial<BaseRequest>, params?: FilterParams) =>
  getSponseredSliderRows(request, params);
