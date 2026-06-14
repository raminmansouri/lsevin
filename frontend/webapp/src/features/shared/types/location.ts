// Location types for shared use across the application
export interface ILocationCountry {
  id: string;
  code: string;
  value: string;
}

export interface ILocationCity {
  id: string;
  code: string;
  value: string;
  parentId: string;
}
