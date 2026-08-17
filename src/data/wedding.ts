/**
 * Single source of truth for every piece of copy on the invitation.
 *
 * Anything in [square brackets] is still a placeholder and must be filled in
 * before invitations go out.
 */

export interface Person {
  first: string;
  full: string;
  role: string;
  order: string;
  father: string;
  mother: string;
  /** Full URL, or omit to hide the Instagram link entirely. */
  instagram?: string;
}

export interface GiftAccount {
  bank: string;
  number: string;
  holder: string;
}

export const wedding = {
  groom: {
    first: 'Adif',
    full: 'Adif Dwi Maulana',
    role: 'Mempelai Pria',
    order: 'Putra pertama dari',
    // [PLACEHOLDER] Groom's parents
    father: '[Nama Ayah]',
    mother: '[Nama Ibu]',
    // [PLACEHOLDER] Real handle, or delete this line to hide the link
    instagram: 'https://instagram.com/username',
  } satisfies Person,

  bride: {
    first: 'Anggun',
    full: 'Anggun Ika Widhiyanti',
    role: 'Mempelai Wanita',
    order: 'Putri pertama dari',
    // [PLACEHOLDER] Bride's parents
    father: '[Nama Ayah]',
    mother: '[Nama Ibu]',
    // [PLACEHOLDER] Real handle, or delete this line to hide the link
    instagram: 'https://instagram.com/username',
  } satisfies Person,

  /**
   * Every date on the page derives from these three values, so the countdown,
   * the calendar link and the printed times cannot drift apart.
   * Akad 08:00 WIB, resepsi 10:00-14:00 WIB.
   */
  akadStart: '2026-10-25T08:00:00+07:00',
  resepsiStart: '2026-10-25T10:00:00+07:00',
  resepsiEnd: '2026-10-25T14:00:00+07:00',

  dateLabel: 'Minggu, 25 Oktober 2026',
  akadTimeLabel: '08.00 WIB – selesai',
  resepsiTimeLabel: '10.00 – 14.00 WIB',

  venue: 'Gedung Islamic Center Kraksaan',
  // [PLACEHOLDER] Refine the street detail if needed
  addressLines: [
    'Jl. Raya Kraksaan, Kecamatan Kraksaan,',
    'Kabupaten Probolinggo, Jawa Timur',
  ],
  venueFull: 'Gedung Islamic Center Kraksaan, Probolinggo, Jawa Timur',
  mapsUrl: 'https://maps.app.goo.gl/9MVwx94iFbcXMCX17',
  mapsEmbedQuery: 'Gedung Islamic Center Kraksaan Probolinggo',

  quote:
    '\u201CDan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda kebesaran Allah bagi kaum yang berpikir.\u201D',
  quoteSource: 'QS. Ar-Rum Ayat 21',

  gifts: [
    // [PLACEHOLDER] Real bank, account number and holder
    { bank: 'Bank BCA', number: '1234567890', holder: 'Adif Dwi Maulana' },
    // [PLACEHOLDER] Real e-wallet provider, number and holder
    { bank: 'DANA / E-Wallet', number: '081234567890', holder: 'Anggun Ika Widhiyanti' },
  ] satisfies GiftAccount[],

  // [PLACEHOLDER] Real shipping address for physical gifts
  giftAddress:
    'Adif & Anggun \u2014 Jl. [Nama Jalan] No. [00], RT [00] / RW [00], Kraksaan, Kabupaten Probolinggo, Jawa Timur [Kode Pos]',

  fallbackGuest: 'Tamu Undangan',
} as const;

export const coupleNames = `${wedding.groom.first} & ${wedding.bride.first}`;
