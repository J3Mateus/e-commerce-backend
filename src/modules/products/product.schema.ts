import { z } from 'zod'

export const ProductResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string(),          // numeric string: "299.00"
  images: z.array(z.string()),
  stock: z.number().int(),
  slug: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
  createdAt: z.string(),
})

export const ProductListQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
})

export type ProductResponse = z.infer<typeof ProductResponseSchema>
