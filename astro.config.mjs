// @ts-check
import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // [PLACEHOLDER] Replace with the real deployed origin. Used for absolute
  // og:image / og:url, which WhatsApp needs to render a link preview.
  site: 'https://undangan-adif-anggun.netlify.app',

  // The adapter is what enables Actions and server islands. The invitation
  // itself stays prerendered; only /_actions/* and the wishes island run
  // on demand.
  adapter: netlify(),
  output: 'static',

  // Astro 7 defaults this to 'jsx', which drops whitespace between inline
  // elements and would visibly close up gaps in the ported markup.
  compressHTML: true,

  env: {
    schema: {
      // Gates /admin. Validated at runtime, not build time, so a deploy that
      // forgets it fails closed with a 500 on /admin rather than letting
      // anyone in.
      ADMIN_PASSWORD: envField.string({ context: 'server', access: 'secret' }),
    },
  },

  image: {
    layout: 'constrained',
    // We size and crop images in CSS, so Astro's generated styles would
    // only fight ours.
    responsiveStyles: false,
    // [PLACEHOLDER] Only needed while the picsum placeholders remain.
    // Delete this once real photos live in src/assets/.
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
});
