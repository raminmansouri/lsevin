import { getSponseredSliderById } from "../../lib/sponsered-slider-db";

export const getSponseredSliderDetails = (sliderId: string) => getSponseredSliderById(sliderId);
