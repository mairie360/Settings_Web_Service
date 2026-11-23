import { screen } from '@testing-library/react';

// The lib ToastProvider (MAIR-851) keeps an empty assertive live region mounted: page alerts are read without it.
export const pageAlerts = () => screen.queryAllByRole('alert').filter(node => !node.matches('[data-m360-component~="ToastProvider"]'));
export const findPageAlert = async () => {
  await screen.findAllByRole('alert');
  let found;
  await new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => { found = pageAlerts()[0]; if (found) resolve(); else if (Date.now() - started > 1000) reject(new Error('no page alert')); else setTimeout(poll, 10); };
    poll();
  });
  return found;
};
/** Title of the warning shown before any confirmed profile (Figma « Profil indisponible »). */
export const UNAVAILABLE = 'Profil temporairement indisponible';
