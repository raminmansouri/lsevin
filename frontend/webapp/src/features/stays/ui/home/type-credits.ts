import type { PropertyKind } from "../../domain/search";

/** Attribution for the "browse by type" photos (Wikimedia Commons; see public/images/stays/CREDITS.json). */
export const TYPE_CREDITS: { kind: PropertyKind; author: string; license: string; source: string }[] = [
  { kind: "hotel", author: "A.Davey", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Hotel_Gardens,_Abbasi_Hotel,_Esfahan,_Iran-4945470747.jpg" },
  { kind: "traditional", author: "s1ingshot", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Traditional_hotel_Yazd.jpg" },
  { kind: "hotel_apartment", author: "Paikan06", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Apartment_hotel_Nice.jpg" },
  { kind: "villa", author: "Hossein Mahmoudi", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Maneli_Villa.jpg" },
  { kind: "cottage", author: "Nahid V", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:A_Cottage_in_Ramsar_(14364271432).jpg" },
  { kind: "ecolodge", author: "Mgparsa", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:%D8%A7%D9%82%D8%A7%D9%85%D8%AA%DA%AF%D8%A7%D9%87_%D8%A8%D9%88%D9%85%DA%AF%D8%B1%D8%AF%DB%8C_%D8%AA%D8%B1%D9%84%D8%A7%D9%86_%D8%B1%D9%88%D8%B3%D8%AA%D8%A7%DB%8C_%D8%AA%D8%B1%D8%AE%DB%8C%D9%86%E2%80%8C%D8%A2%D8%A8%D8%A7%D8%AF_%D8%A7%D8%B3%D8%AF%D8%A2%D8%A8%D8%A7%D8%AF_%D8%A7%D8%B3%D8%AA%D8%A7%D9%86_%D9%87%D9%85%D8%AF%D8%A7%D9%86.jpg" },
];
