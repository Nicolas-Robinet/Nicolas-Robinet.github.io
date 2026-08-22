export interface Project {
  /** Number shown beside the project, e.g. "01". */
  num: string;
  title: string;
  meta: string;
  desc: string;
  url?: string;
}

/* Add projects here. Example:
   {
     num: '01',
     title: 'Project name',
     meta: 'Full-stack · Next.js · PostgreSQL',
     desc: 'One or two sentences on what it is and why it mattered.',
     url: 'https://example.com',
   }
*/
export const projects: Project[] = [
  {
    num: '01',
    title: 'Store Planner',
    meta: 'Full-stack · React PWA · Express · Prisma · SQLite',
    desc: 'Shift planning for supermarket teams. Workers set their availability and claim open shifts from their phone while managers build the roster with automatic conflict detection.',
    url: 'https://github.com/Nicolas-Robinet/store-planner',
  },
]
