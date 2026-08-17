import { defineAction, ActionError } from 'astro:actions';
// astro/zod, not astro:schema — the latter is deprecated as of Astro 6.
import { z } from 'astro/zod';
import { putRsvp, putWish } from '../lib/blobs';

/**
 * Empty form fields arrive as null, not "". Without the preprocess step a blank
 * submit fails the string type check before min() runs, and the guest sees
 * Zod's English default instead of the message below.
 */
const requiredText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : ''),
    z.string().min(1, message).max(max, `Maksimal ${max} karakter`),
  );

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value.trim() : null),
    z.string().max(max).nullable(),
  );

/** Hidden field; only a bot fills it in. */
const honeypot = z.string().nullable().default(null);

export const server = {
  rsvp: defineAction({
    accept: 'form',
    input: z.object({
      nama: requiredText(80, 'Mohon isi nama'),
      // These two are always present in the rendered form, so a missing or
      // out-of-range value means a hand-crafted request; fall back rather than
      // reject.
      jumlah: z.coerce.number().int().min(1).max(10).catch(1),
      kehadiran: z.enum(['Hadir', 'Tidak Hadir', 'Masih Ragu']).catch('Hadir'),
      tamuUndangan: optionalText(80),
      honeypot,
    }),
    handler: async ({ honeypot: trap, ...input }) => {
      if (trap) throw new ActionError({ code: 'BAD_REQUEST', message: 'Ditolak' });

      await putRsvp(input);
      return { ok: true as const };
    },
  }),

  wish: defineAction({
    accept: 'form',
    input: z.object({
      nama: requiredText(80, 'Mohon isi nama'),
      pesan: requiredText(500, 'Mohon isi ucapan'),
      honeypot,
    }),
    handler: async ({ honeypot: trap, ...input }) => {
      if (trap) throw new ActionError({ code: 'BAD_REQUEST', message: 'Ditolak' });

      // Returned so the client can prepend it immediately. The wishes island
      // reads eventually-consistent data, which can lag by up to a minute.
      const wish = await putWish(input);
      return { ok: true as const, wish };
    },
  }),
};
