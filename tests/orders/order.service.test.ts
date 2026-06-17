import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do módulo de db — evita conexão real em testes unitários
vi.mock('../../src/db/index.js', () => ({
  db: {
    transaction: vi.fn(),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}))

vi.mock('../../src/config/env.js', () => ({
  env: {
    MERCADOPAGO_ACCESS_TOKEN: 'TEST-mock-token',
    APP_URL: 'http://localhost:3001',
    FRONTEND_URL: 'http://localhost:3000',
  },
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: 'mp-pref-123',
      sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/mp-pref-123',
    }),
  })),
}))

import { db } from '../../src/db/index.js'
import { createOrder } from '../../src/modules/orders/order.service.js'

describe('createOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria pedido quando há estoque suficiente', async () => {
    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([{ id: 'prod-1', stock: 10, price: '299.00', name: 'Tênis X' }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'order-1', total: '299.00', status: 'pending', customerName: 'João', customerEmail: 'joao@test.com', clerkUserId: 'user-1', mpPreferenceId: null, mpPaymentId: null, createdAt: new Date(), updatedAt: new Date() }]),
        }),
      }),
    }

    vi.mocked(db.transaction).mockImplementation((fn: any) => fn(mockTx))

    const result = await createOrder({
      clerkUserId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      customerName: 'João',
      customerEmail: 'joao@test.com',
    })

    expect(result.orderId).toBe('order-1')
    expect(result.checkoutUrl).toContain('sandbox.mercadopago.com')
  })

  it('lança erro quando estoque insuficiente', async () => {
    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([{ id: 'prod-1', stock: 0, price: '299.00', name: 'Tênis X' }]),
          }),
        }),
      }),
    }

    vi.mocked(db.transaction).mockImplementation((fn: any) => fn(mockTx))

    await expect(
      createOrder({
        clerkUserId: 'user-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
        customerName: 'João',
        customerEmail: 'joao@test.com',
      }),
    ).rejects.toThrow('Estoque insuficiente')
  })
})
