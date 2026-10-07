import { supabase } from "../lib/supabase";

/**
 * Get active products.
 *
 * Optional:
 * categorySlug - filter by category
 * search       - search product name
 */
export async function getProducts({
  categorySlug = null,
  search = null,
} = {}) {
  let query = supabase
    .from("products")
    .select(`
      id,
      seller_id,
      category_id,
      name,
      description,
      brand,
      price,
      discount_percentage,
      stock,
      rating,
      review_count,
      is_active,
      created_at,
      updated_at,
      categories!inner (
        id,
        name,
        slug
      ),
      product_images (
        id,
        image_url
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getProducts error:", error);
    throw error;
  }

  return data || [];
}


/**
 * Get one product.
 */
export async function getProductById(productId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      seller_id,
      category_id,
      name,
      description,
      brand,
      price,
      discount_percentage,
      stock,
      rating,
      review_count,
      is_active,
      created_at,
      updated_at,
      categories (
        id,
        name,
        slug
      ),
      product_images (
        id,
        image_url
      )
    `)
    .eq("id", productId)
    .single();

  if (error) {
    console.error("getProductById error:", error);
    throw error;
  }

  return data;
}


/**
 * Get categories.
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("getCategories error:", error);
    throw error;
  }

  return data || [];
}


/**
 * Calculate final product price.
 */
export function getFinalPrice(price, discountPercentage = 0) {
  const originalPrice = Number(price);
  const discount = Number(discountPercentage);

  return originalPrice - (originalPrice * discount) / 100;
}