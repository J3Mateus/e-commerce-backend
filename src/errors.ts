export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(404, `${resource} não encontrado`)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message)
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super(409, `Estoque insuficiente: ${productName} (disponível: ${available})`)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, `Serviço indisponível: ${service}`)
  }
}
