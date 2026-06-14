export type PickedLocationListItem = {
  id: string;
  locationId: string;
  city: string;
  country: string | null;
  cityCode: string | null;
  countryCode: string | null;
  countryId: string | null;
  image: string;
  imagePreviewUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PickedLocationDetails = PickedLocationListItem;
