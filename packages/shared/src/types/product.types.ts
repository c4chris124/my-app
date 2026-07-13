export enum SalesWeighting {
  MUY_ALTO = 'MUY_ALTO',
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAJO = 'BAJO',
}

export enum UnitType {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  COUNT = 'count',
  LENGTH = 'length',
}

export interface ProductSummaryDto {
  id: string;
  sku: string;
  brandCode: string;
  name: string;
  capacityValue: number | null;
  capacityUnit: string | null;
  brand: string;
  category: string;
  salePrice: number | null;
  distributorPrice: number | null;
  marginPercent: number | null;
  salesWeighting: SalesWeighting | null;
  pricePending: boolean;
  isActive: boolean;
  imageUrls: string[];
}

export interface ProductDetailDto extends ProductSummaryDto {
  description: string | null;
  revenue: number | null;
  supplier: string;
  alternateCodes: string[];
  tags: string[];
}

export interface CategoryTreeDto {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  children: CategoryTreeDto[];
}
