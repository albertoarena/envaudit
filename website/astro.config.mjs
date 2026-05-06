import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://albertoarena.github.io',
  base: '/envaudit',
  integrations: [
    starlight({
      title: 'envaudit',
      description: 'Zero-dependency CLI to audit, compare and sync .env files',
      social: {
        github: 'https://github.com/albertoarena/envaudit',
      },
      editLink: {
        baseUrl: 'https://github.com/albertoarena/envaudit/edit/main/website/',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: 'Introduction',
          items: [
            { label: 'What is envaudit?', link: '/' },
            { label: 'Quickstart', link: '/getting-started/quickstart/' },
          ],
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'CLI Options', link: '/getting-started/cli-options/' },
            { label: 'CI Integration', link: '/getting-started/ci-integration/' },
          ],
        },
        {
          label: 'Commands',
          items: [
            { label: 'check', link: '/commands/check/' },
            { label: 'diff', link: '/commands/diff/' },
            { label: 'sync', link: '/commands/sync/' },
            { label: 'doc', link: '/commands/doc/' },
          ],
        },
        {
          label: 'Rules',
          items: [
            { label: 'Missing Variables', link: '/rules/missing/' },
            { label: 'Undocumented Variables', link: '/rules/undocumented/' },
            { label: 'Empty Values', link: '/rules/empty-values/' },
            { label: 'Secret Detection', link: '/rules/secrets/' },
          ],
        },
      ],
    }),
  ],
})
