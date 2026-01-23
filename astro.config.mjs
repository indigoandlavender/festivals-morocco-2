import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://festivalsinmorocco.com',
  output: 'static',
  build: {
    format: 'directory'
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !page.includes('/api/'),
      customPages: [
        'https://festivalsinmorocco.com/',
        'https://festivalsinmorocco.com/events',
        'https://festivalsinmorocco.com/cities',
        'https://festivalsinmorocco.com/traditions',
        'https://festivalsinmorocco.com/map',
        'https://festivalsinmorocco.com/submit',
      ],
      serialize(item) {
        // Higher priority for main pages
        if (item.url === 'https://festivalsinmorocco.com/') {
          return { ...item, priority: 1.0, changefreq: 'daily' };
        }
        if (item.url.includes('/events') && !item.url.includes('/events/')) {
          return { ...item, priority: 0.9, changefreq: 'daily' };
        }
        if (item.url.includes('/events/')) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        if (item.url.includes('/cities')) {
          return { ...item, priority: 0.7, changefreq: 'weekly' };
        }
        return item;
      },
    }),
  ],
});
