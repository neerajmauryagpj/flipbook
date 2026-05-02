// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    '@nuxt/image'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  devServer: {
    host: '0.0.0.0',
  },
  app: {
    baseURL: '/flipbook/',
    head: {
      title: 'Neeraj weds Anamika ❤️',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💖</text></svg>" }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Neeraj & Anamika Wedding Photo Album' }
      ]
    }
  }
})
