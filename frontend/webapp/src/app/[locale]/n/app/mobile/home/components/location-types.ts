export interface Location {
    id: string;          // unique id
    city: string;        // e.g. "Dubai"
    country: string;     // e.g. "UAE"
    image: string;       // URL to the icon image
}

export interface LocationsResponse {
    locations: Location[];
}
