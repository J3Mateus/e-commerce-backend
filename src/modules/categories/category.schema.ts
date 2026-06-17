import { z } from 'zod'

export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
})

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>
