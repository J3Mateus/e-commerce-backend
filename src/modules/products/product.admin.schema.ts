import { z } from 'zod'

export const CreateProductBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be decimal string like "299.00"'),
  images: z.array(z.string().url()).default([]),
  stock: z.number().int().min(0),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  categoryId: z.string().uuid(),
})

export const UpdateProductBodySchema = CreateProductBodySchema.partial()

export type CreateProductBody = z.infer<typeof CreateProductBodySchema>
export type UpdateProductBody = z.infer<typeof UpdateProductBodySchema>
