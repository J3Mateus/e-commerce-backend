import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { categories } from '../../db/schema.js'
import type { CategoryResponse } from './category.schema.js'
import type { CreateCategoryBody, UpdateCategoryBody } from './category.admin.schema.js'

function toResponse(cat: typeof categories.$inferSelect): CategoryResponse {
  return { id: cat.id, name: cat.name, slug: cat.slug, createdAt: cat.createdAt.toISOString() }
}

export async function createCategory(data: CreateCategoryBody): Promise<CategoryResponse> {
  const [cat] = await db.insert(categories).values(data).returning()
  if (!cat) throw new Error('Insert returned no row')
  return toResponse(cat)
}

export async function updateCategory(id: string, data: UpdateCategoryBody): Promise<CategoryResponse | null> {
  const [cat] = await db.update(categories).set(data).where(eq(categories.id, id)).returning()
  return cat ? toResponse(cat) : null
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await db.delete(categories).where(eq(categories.id, id)).returning()
  return result.length > 0
}
