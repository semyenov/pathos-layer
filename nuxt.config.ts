// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  build: {
    transpile: [
      "graphql-shield",
      "graphql-middleware",
      "graphql-yoga",
      "@graphql-yoga/logger",
      "@envelop/instrumentation",
      "@graphql-yoga/subscription",
      "@envelop/core",
      "@envelop/graphql",
      "@envelop/types",
      "@envelop/graphql-shield",
      "@envelop/graphql-middleware",
      "@envelop/graphql-yoga",
      "@envelop/graphql-ws",
      "@envelop/graphql-upload",
      "graphql-ws",
      "graphql-upload",
      "graphql-type-json",
    ],
  },

  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@nuxt/ui",
  ],
})