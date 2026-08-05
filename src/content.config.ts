import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    /** Display date shown in the list, e.g. "Feb 2026". */
    date: z.string(),
    /** Reading time shown in the post meta, e.g. "6 min read". */
    read: z.string(),
    excerpt: z.string(),
  }),
});

export const collections = { posts };
