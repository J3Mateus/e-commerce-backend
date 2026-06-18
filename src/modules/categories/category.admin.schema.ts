import { z } from 'zod'

export const CreateCategoryBodySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

export const UpdateCategoryBodySchema = CreateCategoryBodySchema.partial()

export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>
export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>
