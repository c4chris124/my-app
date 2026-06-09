export interface CatalogItem {
  id: string;
  name: string;
  itemCount: number;
}

export interface CatalogListResponse {
  data: CatalogItem[];
  total: number;
}
