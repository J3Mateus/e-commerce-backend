import 'dotenv/config'
import { db } from '../db/index.js'
import { categories, products } from './schema.js'

async function seed() {
  console.log('Seeding database...')

  const [running, lifestyle, training] = await db
    .insert(categories)
    .values([
      { name: 'Running', slug: 'running' },
      { name: 'Lifestyle', slug: 'lifestyle' },
      { name: 'Training', slug: 'training' },
    ])
    .returning()

  await db.insert(products).values([
    {
      categoryId: running.id,
      name: 'Air Max Speed',
      description: 'Tênis de corrida de alta performance para treinos intensos.',
      price: '899.00',
      images: ['https://placehold.co/600x400?text=Air+Max+Speed'],
      stock: 50,
      slug: 'air-max-speed',
    },
    {
      categoryId: running.id,
      name: 'React Infinity Run',
      description: 'Amortecimento React para longas distâncias.',
      price: '749.00',
      images: ['https://placehold.co/600x400?text=React+Infinity'],
      stock: 30,
      slug: 'react-infinity-run',
    },
    {
      categoryId: lifestyle.id,
      name: 'Air Force 1',
      description: 'Ícone do estilo urbano.',
      price: '599.00',
      images: ['https://placehold.co/600x400?text=Air+Force+1'],
      stock: 100,
      slug: 'air-force-1',
    },
    {
      categoryId: lifestyle.id,
      name: 'Blazer Mid',
      description: 'Clássico reinterpretado para o cotidiano.',
      price: '499.00',
      images: ['https://placehold.co/600x400?text=Blazer+Mid'],
      stock: 45,
      slug: 'blazer-mid',
    },
    {
      categoryId: training.id,
      name: 'Metcon 9',
      description: 'Estabilidade e durabilidade para treino funcional.',
      price: '699.00',
      images: ['https://placehold.co/600x400?text=Metcon+9'],
      stock: 25,
      slug: 'metcon-9',
    },
  ])

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
