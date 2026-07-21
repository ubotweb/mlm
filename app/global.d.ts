import {} from 'hono'
import '@hono/react-renderer'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response
  }
}
