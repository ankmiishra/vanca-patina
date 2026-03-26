import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import api from "@/services/api";
import { mapBackendProduct } from "@/lib/mapBackendProduct";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get("/api/products", { params: { pageNumber: 1, pageSize: 200 } })
      .then((res) => {
        if (cancelled) return;

        // Debug: Log full response
        console.log("📦 Products API Response:", res.data);

        // Handle both response formats:
        // Format 1: {products: [...], page: 1, pages: 1}
        // Format 2: [...] (array directly)
        const data = res.data;
        let list: any[] = [];

        if (Array.isArray(data)) {
          // Direct array response
          list = data;
        } else if (data?.products && Array.isArray(data.products)) {
          // Wrapped response {products: [...]}
          list = data.products;
        } else {
          // Unexpected format
          console.error("❌ Unexpected response format:", data);
          throw new Error("Invalid response format from API");
        }

        if (!Array.isArray(list) || list.length === 0) {
          console.warn("⚠️ No products found in response");
        }

        // Map products
        const mappedProducts = list.map(mapBackendProduct);
        console.log("✅ Mapped products:", mappedProducts.length);

        setProducts(mappedProducts);
      })
      .catch((e) => {
        if (cancelled) return;

        console.error("❌ Error fetching products:", e);
        const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load products";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
};
