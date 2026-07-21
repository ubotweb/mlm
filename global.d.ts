/// <reference types="@cloudflare/workers-types" />
import {} from 'hono'

type Env = {
  DB: D1Database
  SESSION_KV: KVNamespace
  BONUS_QUEUE: Queue
  JWT_SECRET: string
}

declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: any
  }
  interface Env {
    Bindings: Env
    Variables: {
      jwtPayload: any
    }
  }
}
