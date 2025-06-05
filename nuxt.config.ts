// https://nuxt.com/docs/api/configuration/nuxt-config

// import { createResolver } from 'nuxt/kit'
// const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  compatibilityDate: '2025-06-04',
  devtools: { enabled: true },

  build: {
    transpile: [
      // "@pothos/core",
      // "@pothos/plugin-drizzle",
      // "@pothos/plugin-relay",
      // "@pothos/plugin-scope",
      // "@pothos/plugin-tracing",
      // "@pothos/plugin-validation",
      // "@pothos/plugin-with",
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
    // "@nuxt/content",
    // "@nuxt/eslint",
    // "@nuxt/fonts",
    // "@nuxt/icon",
    // "@nuxt/image",
    // "@nuxt/scripts",
    // "@nuxt/test-utils",
    // "@nuxt/ui",
  ],
})