import defaultProductImage from "@/assets/default-product.jpg";
import { Product } from "@/types/product";

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Convert backend image path to absolute URL
 * Handles /uploads/ relative paths and absolute URLs
 */
function normalizeImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return defaultProductImage;

  // If already absolute URL, return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If relative path from backend (e.g., /uploads/file.jpg), make it absolute
  if (imagePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Fallback to default if path is invalid
  return defaultProductImage;
}

export function mapBackendProduct(item: any): Product {
  const price = Number(item.price ?? 0);
  const rating = Number(item.ratings ?? item.rating ?? 0);
  const reviews = Number(item.numReviews ?? item.reviews ?? 0);
  const stock = Number(item.stock ?? 0);

  // Debug: Log if image is missing
  if (!item.image || item.image.includes("undefined")) {
    console.warn(`⚠️ Product "${item.name}" has invalid image:`, item.image);
  }

  return {
    id: String(item._id ?? item.id),
    name: item.name ?? "",
    price,
    originalPrice: price > 0 ? Math.round(price * 1.2) : undefined,
    description: item.description ?? "",
    shortDescription: String(item.description ?? "").slice(0, 60),
    category: item.category ?? "General",
    finishType: item.finishType ?? item.category ?? "Standard",
    image: normalizeImageUrl(item.image),
    rating,
    reviews,
    inStock: stock > 0,
    badge: item.badge ?? undefined,
  };
}

