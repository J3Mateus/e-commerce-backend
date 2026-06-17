import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { products, categories } from '../../db/schema.js'
import type { ProductResponse } from './product.schema.js'

function toProductResponse(row: {
  product: typeof products.$inferSelect
  category: typeof categories.$inferSelect
}): ProductResponse {
  return {
    id: row.product.id,
    name: row.product.name,
    description: row.product.description ?? null,
    price: row.product.price,
    images: row.product.images ?? [],
    stock: row.product.stock,
    slug: row.product.slug,
    category: {
      id: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
    },
    createdAt: row.product.createdAt.toISOString(),
  }
}

export async function listProducts(categoryId?: string): Promise<ProductResponse[]> {
  const query = db
    .select()
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))

  const rows = categoryId
    ? await query.where(eq(products.categoryId, categoryId))
    : await query

  return rows.map((r) => toProductResponse({ product: r.products, category: r.categories }))
}

export async function getProductById(id: string): Promise<ProductResponse | null> {
  const [row] = await db
    .select()
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))

  if (!row) return null
  return toProductResponse({ product: row.products, category: row.categories })
}
