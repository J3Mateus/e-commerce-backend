import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { products, categories } from '../../db/schema.js'
import type { CreateProductBody, UpdateProductBody } from './product.admin.schema.js'
import type { ProductResponse } from './product.schema.js'
import { NotFoundError } from '../../errors.js'

async function toProductResponse(product: typeof products.$inferSelect): Promise<ProductResponse> {
  const [category] = await db.select().from(categories).where(eq(categories.id, product.categoryId))
  if (!category) throw new NotFoundError('Categoria')
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    images: product.images,
    stock: product.stock,
    slug: product.slug,
    category: { id: category.id, name: category.name, slug: category.slug },
    createdAt: product.createdAt.toISOString(),
  }
}

export async function createProduct(data: CreateProductBody): Promise<ProductResponse> {
  const [product] = await db.insert(products).values({
    name: data.name,
    description: data.description ?? null,
    price: data.price,
    images: data.images,
    stock: data.stock,
    slug: data.slug,
    categoryId: data.categoryId,
  }).returning()
  if (!product) throw new Error('Insert retornou vazio')
  return toProductResponse(product)
}

export async function updateProduct(id: string, data: UpdateProductBody): Promise<ProductResponse | null> {
  const updates: Partial<typeof products.$inferInsert> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description ?? null
  if (data.price !== undefined) updates.price = data.price
  if (data.images !== undefined) updates.images = data.images
  if (data.stock !== undefined) updates.stock = data.stock
  if (data.slug !== undefined) updates.slug = data.slug
  if (data.categoryId !== undefined) updates.categoryId = data.categoryId
  updates.updatedAt = new Date()

  const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning()
  if (!product) return null
  return toProductResponse(product)
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await db.delete(products).where(eq(products.id, id)).returning()
  return result.length > 0
}
