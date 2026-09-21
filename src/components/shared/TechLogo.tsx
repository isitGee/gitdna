import { BRAND_LOGOS } from './brandLogos'

/** Maps technology names produced by the analyzer to simple-icons slugs. */
const NAME_TO_SLUG: Record<string, string> = {
  JavaScript: 'javascript', TypeScript: 'typescript', HTML: 'html5', CSS: 'css', SCSS: 'sass',
  JSON: 'json', YAML: 'yaml', Markdown: 'markdown', TOML: 'toml', SQL: 'sql',
  Python: 'python', Go: 'go', Rust: 'rust', Ruby: 'ruby', PHP: 'php', Java: 'openjdk',
  Kotlin: 'kotlin', Swift: 'swift', C: 'c', 'C++': 'cplusplus', 'C#': 'csharp', Scala: 'scala',
  Elixir: 'elixir', Dart: 'dart', Lua: 'lua', R: 'r', Zig: 'zig', Shell: 'gnubash',
  PowerShell: 'powershell', 'Jupyter Notebook': 'jupyter',
  React: 'react', Vue: 'vuedotjs', Svelte: 'svelte', SvelteKit: 'svelte', Angular: 'angular',
  'Next.js': 'nextdotjs', Nuxt: 'nuxt', Astro: 'astro', Express: 'express', Fastify: 'fastify',
  Gatsby: 'gatsby', Django: 'django', Flask: 'flask', Flutter: 'flutter', Jekyll: 'jekyll',
  'Node.js': 'nodedotjs', Docker: 'docker', 'Docker Compose': 'docker',
  'GitHub Actions': 'githubactions', 'GitHub Pages': 'githubpages',
  Vite: 'vite', Webpack: 'webpack', 'Tailwind CSS': 'tailwindcss', Redux: 'redux',
  'React Router': 'reactrouter', Axios: 'axios', 'Three.js': 'threedotjs', D3: 'd3',
  'Chart.js': 'chartdotjs', 'Framer Motion': 'framer', 'Material UI': 'mui',
  'React Testing Library': 'testinglibrary', Jest: 'jest', Vitest: 'vitest',
  Mongoose: 'mongoose', Prisma: 'prisma', Sequelize: 'sequelize',
  'PostgreSQL driver': 'postgresql', 'MySQL driver': 'mysql', 'Redis client': 'redis',
  'Socket.IO': 'socketdotio', 'Stripe API': 'stripe', 'OpenAI API': 'openai',
  Firebase: 'firebase', Supabase: 'supabase', NumPy: 'numpy', pandas: 'pandas',
  'scikit learn': 'scikitlearn', PyTorch: 'pytorch', TensorFlow: 'tensorflow', Keras: 'keras',
  Celery: 'celery', SQLAlchemy: 'sqlalchemy', Streamlit: 'streamlit', pytest: 'pytest',
  Gradle: 'gradle', Maven: 'apachemaven', CMake: 'cmake', Git: 'git',
}

/** Neutral glyphs for technologies without an official mark in the set. */
function FallbackGlyph({ kind }: { kind: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true" style={{ color: 'var(--ink-3)' }}>
      {kind === 'language' && <g {...common}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" /></g>}
      {kind === 'framework' && <g {...common}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></g>}
      {kind === 'platform' && <g {...common}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.2 3.8 5 3.8 8S14.5 19.8 12 20c-2.5-.2-3.8-5-3.8-8S9.5 6.2 12 4z" /></g>}
      {kind === 'tool' && <g {...common}><path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L4 16.6V20h3.4l4.7-4.7a4.5 4.5 0 0 0 5.6-6l-2.8 2.8-2.4-.6-.6-2.4z" /></g>}
      {kind === 'data' && <g {...common}><ellipse cx="12" cy="6" rx="7" ry="2.6" /><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" /></g>}
    </svg>
  )
}

const CATEGORY_KIND: Record<string, string> = {
  Language: 'language', Framework: 'framework', Platform: 'platform', Tooling: 'tool', Library: 'data',
}

export function TechLogo({ name, category, size = 22 }: { name: string; category?: string; size?: number }) {
  const slug = NAME_TO_SLUG[name]
  const brand = slug ? BRAND_LOGOS[slug] : undefined
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={`${name} logo`}>
        <path d={brand.d} fill={`#${brand.hex}`} />
      </svg>
    )
  }
  return (
    <span style={{ width: size, height: size, display: 'grid', placeItems: 'center' }} role="img" aria-label={`${name} icon`}>
      <FallbackGlyph kind={(category && CATEGORY_KIND[category]) || 'tool'} />
    </span>
  )
}
