import { defineAction, ActionError } from 'astro:actions';
// astro/zod, not astro:schema — the latter is deprecated as of Astro 6.
import { z } from 'astro/zod';
import { deleteWish, putRsvp, putWish } from '../lib/blobs';
import { ADMIN_SESSION_KEY, isAdmin, verifyPassword } from '../lib/auth';

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

  login: defineAction({
    accept: 'form',
    input: z.object({ password: z.string().max(200).catch('') }),
    handler: async ({ password }, context) => {
      if (!(await verifyPassword(password))) {
        // Slows credential stuffing a little. Serverless functions give no
        // shared counter to rate-limit against, so this and a strong password
        // are the whole defence.
        await new Promise((resolve) => setTimeout(resolve, 700));
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Kata sandi salah' });
      }

      context.session?.set(ADMIN_SESSION_KEY, true);
      return { ok: true as const };
    },
  }),

  logout: defineAction({
    accept: 'form',
    handler: async (_input, context) => {
      context.session?.destroy();
      return { ok: true as const };
    },
  }),

  removeWish: defineAction({
    accept: 'form',
    input: z.object({ key: z.string().min(1).max(200) }),
    handler: async ({ key }, context) => {
      if (!(await isAdmin(context.session))) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Tidak diizinkan' });
      }

      await deleteWish(key);
      return { ok: true as const };
    },
  }),
};
