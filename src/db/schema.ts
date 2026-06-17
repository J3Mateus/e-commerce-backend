import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
])

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('categories_slug_idx').on(table.slug)],
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    images: text('images').array().notNull().default(sql`'{}'`),
    stock: integer('stock').notNull().default(0),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('products_category_id_idx').on(table.categoryId),
    index('products_slug_idx').on(table.slug),
    check('stock_non_negative', sql`${table.stock} >= 0`),
  ],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    mpPreferenceId: varchar('mp_preference_id', { length: 255 }),
    mpPaymentId: varchar('mp_payment_id', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('orders_clerk_user_id_idx').on(table.clerkUserId),
    index('orders_mp_payment_id_idx').on(table.mpPaymentId),
    index('orders_status_idx').on(table.status),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    unique('order_items_order_product_unique').on(table.orderId, table.productId),
    check('quantity_positive', sql`${table.quantity} > 0`),
  ],
)
