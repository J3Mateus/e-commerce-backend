import { db } from '../../db/index.js'
import { categories } from '../../db/schema.js'
import type { CategoryResponse } from './category.schema.js'

export async function listCategories(): Promise<CategoryResponse[]> {
  const rows = await db.select().from(categories).orderBy(categories.name)
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    createdAt: r.createdAt.toISOString(),
  }))
}
