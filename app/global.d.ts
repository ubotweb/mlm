import {} from 'hono'
import { D1Database } from '@cloudflare/workers-types'

declare global {
  interface Env {
    DB: D1Database
    JWT_SECRET: string
    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
  }
}
