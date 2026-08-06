export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  image: string;
  image2?: string;
  category: string;
  colors: { name: string; hex: string }[];
  variantsLabel?: string; // e.g., "Switch Type" or "Taille"
  variants?: string[]; // e.g., ["Red Cherry", "Brown Gateron"] or ["Standard", "Extra Wide"]
  features: string[];
  stock: number;
  affiliateCode?: string;
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  selectedColor: { name: string; hex: string };
  selectedVariant?: string;
  quantity: number;
}

export interface PromoCode {
  code: string;
  discount: number;
  description: string;
  status: "active" | "planned";
}

