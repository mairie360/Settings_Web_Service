import type { SettingsProfile, SettingsProfilePatch } from '@mairie360/bff-settings-openapi/model';
import { BffRequestError } from './bff-client';
import type { BffErrorDetail } from './bff-client';

// Rules of the profile form, mirrored from the `SettingsProfilePatch` schema of the published BFF_Settings
// contract (tests/settings-page.bff-mocks.test.cjs pins them to contracts/openapi.json) and from the BFF's
// own handling of `PATCH /settings/profile` (MAIR-511).

// Fields of the form: those of the read profile that are also editable (`SettingsProfilePatch` also carries
// `current_password` and `phone_country`, which are not fields of the displayed profile).
export type ProfileField = keyof SettingsProfile & keyof SettingsProfilePatch;

export type ProfileFieldRule = {
  field: ProfileField;
  label: string;
  type: 'email' | 'tel' | 'text' | 'textarea';
  required: boolean;
  maxLength: number;
  /** HTML `pattern`: anchored by the browser and compiled with the `v` flag, hence the escaped `(`, `)` and `-`. */
  pattern?: string;
  help?: string;
};

const NAME_RULE = { type: 'text', required: true, maxLength: 64, pattern: '[^<>]*', help: '64 caractères maximum, sans < ni >.' } as const;

export const PROFILE_FIELDS: ReadonlyArray<ProfileFieldRule> = [
  { field: 'first_name', label: 'Prénom', ...NAME_RULE },
  { field: 'last_name', label: 'Nom', ...NAME_RULE },
  { field: 'email', label: 'E-mail', type: 'email', required: true, maxLength: 320 },
  {
    // Decision of the mairie (MAIR-292, GDPR): the directory shows the phone to every agent, for work,
    // so the form says who sees it before the format rule.
    field: 'phone',
    label: 'Téléphone',
    type: 'tel',
    required: false,
    maxLength: 32,
    pattern: '(\\+?[\\d\\s.\\(\\)\\-]+)?',
    help: 'Visible par tous les agents de la mairie (usage professionnel). Chiffres, espaces, points, tirets et parenthèses, avec un + initial facultatif (32 caractères maximum).',
  },
  // Plain texts, both optional: a blank value removes them.
  { field: 'job_title', label: 'Fonction', type: 'text', required: false, maxLength: 100, pattern: '[^\\r\\n]*' },
  { field: 'biography', label: 'Bio', type: 'textarea', required: false, maxLength: 1000, help: '1000 caractères maximum.' },
];

/** Fields the agent may leave empty: an empty value is sent as `null`, which removes it. */
export const CLEARABLE_FIELDS: ReadonlyArray<ProfileField> = ['phone', 'job_title', 'biography'];

/** The service is set by the administration: shown, never sent. */
export const SERVICE_FIELD = { label: 'Service', help: 'Défini par l’administration.', none: 'Aucun service' } as const;

/** The current password confirms an e-mail change; it is sent once and never kept with the profile. */
export const CURRENT_PASSWORD = {
  field: 'current_password',
  label: 'Mot de passe actuel',
  maxLength: 255,
  help: 'Requis pour confirmer le changement d’adresse e-mail. Il n’est pas conservé.',
} as const;

export const PASSWORD_REQUIRED_MESSAGE = 'Saisissez votre mot de passe actuel pour changer votre adresse e-mail.';

/** Same comparison as BFF_Settings: an e-mail equal to the confirmed one (trimmed, case-insensitive) is not a change. */
export function isEmailChanged(confirmed: SettingsProfile, current: SettingsProfile): boolean {
  return current.email.trim().toLowerCase() !== confirmed.email.trim().toLowerCase();
}

export function profilePatch(initial: SettingsProfile, current: SettingsProfile): SettingsProfilePatch {
  const patch: SettingsProfilePatch = {};

  if (current.first_name !== initial.first_name) patch.first_name = current.first_name;
  if (current.last_name !== initial.last_name) patch.last_name = current.last_name;
  if (current.email !== initial.email) patch.email = current.email;
  if (current.phone !== initial.phone) patch.phone = current.phone ?? null;
  if ((current.job_title ?? null) !== (initial.job_title ?? null)) patch.job_title = current.job_title?.trim() || null;
  if ((current.biography ?? null) !== (initial.biography ?? null)) patch.biography = current.biography?.trim() || null;

  return patch;
}

const FIELD_LABELS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(PROFILE_FIELDS.map(({ field, label }) => [field, label])),
  [CURRENT_PASSWORD.field]: CURRENT_PASSWORD.label,
  phone_country: 'Pays du téléphone',
};

// Messages of the BFF's validation details (its own strings and zod's defaults), translated for the form.
const DETAIL_TRANSLATIONS: ReadonlyArray<[RegExp, string | ((match: RegExpMatchArray) => string)]> = [
  [/^Required when email is changed$/, 'requis pour changer l’adresse e-mail'],
  [/^Must not contain < or >$/, 'ne doit pas contenir < ni >'],
  [/^Expected a phone number\b/, 'chiffres, espaces, points, tirets, parenthèses et un + initial seulement'],
  [/^Expected an ISO 3166-1 alpha-2 code$/, 'code pays à deux lettres attendu'],
  [/^Must fit on one line$/, 'doit tenir sur une ligne'],
  [/^Invalid email/, 'adresse e-mail invalide'],
  [/^Required$/, 'requis'],
  [/^Unrecognized key/, 'champ non pris en charge'],
  [/at least 1 character/, 'ne doit pas être vide'],
  [/at least (\d+) character/, (match) => `${match[1]} caractères minimum`],
  [/at most (\d+) character|<=(\d+) characters/, (match) => `${match[1] ?? match[2]} caractères maximum`],
];

function translateDetailMessage(message: string): string {
  for (const [matcher, translation] of DETAIL_TRANSLATIONS) {
    const match = message.match(matcher);
    if (match) return typeof translation === 'string' ? translation : translation(match);
  }
  return message;
}

/** `body.current_password` → `Mot de passe actuel : requis pour changer l’adresse e-mail`. */
export function describeDetail({ path, message }: BffErrorDetail): string {
  const field = path?.split('.').filter((part) => part && part !== 'body').pop();
  const text = translateDetailMessage(message);
  return field ? `${FIELD_LABELS[field] ?? field} : ${text}` : text;
}

/** Local checks of the V2 form (MAIR-864, parcours P2), shown under each field before any request. */
export const FIELD_MESSAGES = {
  first_name: 'Le prénom est obligatoire.',
  last_name: 'Le nom est obligatoire.',
  email: 'Adresse invalide (ex. prenom.nom@mairie.fr).',
  phone: 'Saisissez un numéro au format 06 12 34 56 78.',
  job_title: 'La fonction tient sur une ligne de 100 caractères au plus.',
  biography: 'La bio ne dépasse pas 1000 caractères.',
} as const;
export type FieldErrors = Partial<Record<ProfileField | 'current_password', string>>;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_SHAPE = /^\+?[\d\s.()-]*\d[\d\s.()-]*$/;

/** Errors of the fields the agent can fix before saving; empty when the draft can be sent. */
export function validateProfile(profile: SettingsProfile): FieldErrors {
  const errors: FieldErrors = {};
  if (!profile.first_name.trim()) errors.first_name = FIELD_MESSAGES.first_name;
  if (!profile.last_name.trim()) errors.last_name = FIELD_MESSAGES.last_name;
  if (!EMAIL_SHAPE.test(profile.email.trim())) errors.email = FIELD_MESSAGES.email;
  const phone = profile.phone?.trim();
  if (phone && (!PHONE_SHAPE.test(phone) || phone.replace(/\D/g, '').length < 6)) errors.phone = FIELD_MESSAGES.phone;
  const jobTitle = profile.job_title?.trim() ?? '';
  if (jobTitle.length > 100 || /[\r\n]/.test(jobTitle)) errors.job_title = FIELD_MESSAGES.job_title;
  if ((profile.biography?.trim() ?? '').length > 1000) errors.biography = FIELD_MESSAGES.biography;
  return errors;
}

/** Fields of a BFF 400 (`details[].path` = `body.<field>`) that the form shows under the field. */
export function detailFieldErrors(details: readonly BffErrorDetail[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const detail of details) {
    const field = detail.path?.split('.').filter((part) => part && part !== 'body').pop();
    if (field && (field === 'current_password' || PROFILE_FIELDS.some((rule) => rule.field === field))) {
      errors[field as keyof FieldErrors] ??= describeDetail(detail).replace(/^[^:]+ : /, '').replace(/^./, (first) => first.toUpperCase()) + '.';
    }
  }
  return errors;
}

export type SaveError = { message: string; details: string[] };

/** French message of a refused profile save, with one line per validation detail of the BFF. */
export function saveErrorMessage(reason: unknown, withPassword: boolean): SaveError {
  if (reason instanceof BffRequestError) {
    if (reason.status === 403 && withPassword) {
      return { message: 'Le mot de passe actuel est incorrect, ou ce compte n’a pas de mot de passe.', details: [] };
    }
    if (reason.status === 409) return { message: 'Cette adresse e-mail est déjà utilisée par un autre compte.', details: [] };
    if (reason.status === 400 && reason.details.length) {
      return { message: 'Le profil n’a pas pu être enregistré : vérifiez les champs signalés.', details: reason.details.map(describeDetail) };
    }
  }
  return { message: reason instanceof Error ? reason.message : 'Le profil n’a pas pu être enregistré.', details: [] };
}
