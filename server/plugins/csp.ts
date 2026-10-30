// Memberi nonce dari server/middleware/keamanan.ts ke setiap <script> di HTML hasil render,
// termasuk skrip tema di <head> dan skrip entry Nuxt. CSP hanya mengizinkan skrip bernonce.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context.nonce as string | undefined
    if (!nonce) return
    const tempel = (s: string) => s.replace(/<script(?![^>]*\snonce=)/g, `<script nonce="${nonce}"`)
    html.head = html.head.map(tempel)
    html.bodyPrepend = html.bodyPrepend.map(tempel)
    html.body = html.body.map(tempel)
    html.bodyAppend = html.bodyAppend.map(tempel)
  })
})
