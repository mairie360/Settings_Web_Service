import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { SettingsTabs, settingsPanelId, settingsTabId, settingsTabs, tabFromUrl, tabToUrl, SettingsHeader, SettingsLoading, SettingsNotices, ProfilePhoto, PasswordForm, TwoFactorSection, SessionsSection, PreferenceSelect, AppearancePreview, DiagnosticSection, BrowserInformation, FeedbackToast, FailureToast, SettingsSection } from '@/components/settings';

vi.mock('@/lib/logout', () => ({ navigateToLogin: vi.fn(), logoutAndRedirect: vi.fn() }));

describe('Settings tabs (lib Tabs, MAIR-608)', () => {
  it('maps the historical URL values and renders six tabs with stable ids owning the host panel', async () => {
    expect(tabFromUrl('notification-preferences')).toBe('notifications'); expect(tabFromUrl('system-assistance')).toBe('system'); expect(tabFromUrl('profile')).toBe('profile');
    expect(tabToUrl('notifications')).toBe('notification-preferences'); expect(tabToUrl('system')).toBe('system-assistance'); expect(tabToUrl('general')).toBe('general');
    const onChange = vi.fn(); const user = userEvent.setup();
    const { container } = render(<><SettingsTabs value="profile" onChange={onChange} /><div role="tabpanel" id={settingsPanelId('profile')} aria-labelledby={settingsTabId('profile')}>Contenu</div></>);
    const tabs = within(screen.getByRole('tablist', { name: 'Paramètres' })).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(settingsTabs.map((tab) => tab.label));
    expect((tabs[0]).getAttribute('aria-controls')).toBe('settings-panel-profile'); expect((tabs[1]).hasAttribute('aria-controls')).toBe(false);
    for (const tab of tabs) expect(tab.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    await user.click(tabs[2]); expect(onChange).toHaveBeenCalledWith('notifications');
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('Settings page parts', () => {
  it('renders the header, the loading and unavailable states', () => {
    const { rerender } = render(<SettingsHeader />);
    expect(screen.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeTruthy(); expect(document.querySelector('.page-current-date')).not.toBeNull();
    rerender(<SettingsLoading reading failed={false} />);
    expect(screen.getByText('Chargement des paramètres…')).toBeTruthy(); expect(document.querySelector('.mairie-skeleton')).not.toBeNull();
    rerender(<SettingsLoading reading={false} failed />);
    expect(screen.getByText('Le profil est indisponible.')).toBeTruthy(); expect(document.querySelector('.mairie-skeleton')).toBeNull();
  });
  it('announces the three kinds of failure and offers Réessayer before data, Actualiser after', async () => {
    const user = userEvent.setup(); const onReload = vi.fn();
    const { rerender } = render(<SettingsNotices error="" errorDetails={[]} readError="" logoutError="" recoverable={false} hasData reading={false} saving={false} onReload={onReload} />);
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByRole('button')).toBeNull();
    rerender(<SettingsNotices error="Enregistrement refusé" errorDetails={['first_name : trop long']} readError="Lecture refusée" logoutError="La déconnexion reste à vérifier." recoverable hasData={false} reading={false} saving={false} onReload={onReload} />);
    expect(screen.getAllByRole('alert')).toHaveLength(3); expect(screen.getByText('first_name : trop long')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Réessayer' })); expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Retour à la connexion' })).toBeTruthy();
    rerender(<SettingsNotices error="" errorDetails={[]} readError="" logoutError="" recoverable hasData reading saving={false} onReload={onReload} />);
    expect((screen.getByRole('button', { name: 'Chargement…' })).disabled).toBe(true);
  });
  it('wraps a card in a section with its h2 and description and keeps receipts announced', () => {
    render(<SettingsSection title="Sessions" description="Vos connexions"><p>Lignes</p></SettingsSection>);
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeTruthy(); expect((screen.getByText('Vos connexions')).classList.contains('settings-section-description')).toBe(true);
    const close = vi.fn();
    const { rerender } = render(<FeedbackToast message="" onClose={close} />);
    expect((screen.getByRole('status')).classList.contains('sr-only')).toBe(true);
    rerender(<FeedbackToast message="Préférences enregistrées." onClose={close} />);
    expect((screen.getByRole('status')).textContent).toContain('Préférences enregistrées.'); fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' })); expect(close).toHaveBeenCalled();
    rerender(<FailureToast message="Refusé" onClose={close} />); expect((screen.getByRole('alert')).textContent).toContain('Refusé');
  });
});

describe('Profile and security cards', () => {
  it('validates the photo before previewing it and offers save / clear', async () => {
    const onInvalid = vi.fn(); const onPreview = vi.fn(); const onSave = vi.fn();
    // jsdom has no object URLs: the preview only needs a stable string.
    const createObjectURL = vi.fn(() => 'blob:preview'); const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    render(<ProfilePhoto initials="AM" busy={false} confirmedPhoto="" onInvalid={onInvalid} onPreview={onPreview} onSave={onSave} />);
    expect(screen.getByText('AM')).toBeTruthy();
    const input = screen.getByLabelText('Changer la photo');
    fireEvent.change(input, { target: { files: [new File(['x'], 'doc.txt', { type: 'text/plain' })] } }); expect(onInvalid).toHaveBeenCalled(); expect(onPreview).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] } }); expect(onPreview).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la photo' })); expect(onSave).toHaveBeenCalledWith(expect.any(File));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer l’aperçu' })); expect(screen.getByText('Aucun fichier choisi')).toBeTruthy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview'); vi.unstubAllGlobals();
  });
  it('checks the password confirmation locally and clears the fields when the epoch changes', async () => {
    const user = userEvent.setup(); const onInvalid = vi.fn(); const onSubmit = vi.fn();
    const { rerender } = render(<PasswordForm busy={false} epoch={0} onInvalid={onInvalid} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Mot de passe actuel'), 'old'); await user.type(screen.getByLabelText('Nouveau mot de passe'), 'new'); await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'other');
    fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
    expect(onInvalid).toHaveBeenCalledWith(expect.stringMatching(/ne correspondent pas/)); expect(onSubmit).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Confirmer le mot de passe')); await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'new');
    fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
    expect(onSubmit).toHaveBeenCalledWith('old', 'new', expect.any(Function));
    rerender(<PasswordForm busy={false} epoch={1} onInvalid={onInvalid} onSubmit={onSubmit} />);
    expect((screen.getByLabelText('Mot de passe actuel')).value).toBe('');
  });
  it('links two-factor to the account console only when the instance has one, and names the sessions card', () => {
    const { rerender } = render(<TwoFactorSection twoFactorUrl="https://sso.example/account" />);
    expect((screen.getByRole('link', { name: 'Gérer ma double authentification' })).getAttribute('href')).toBe('https://sso.example/account');
    rerender(<TwoFactorSection />); expect(screen.getByText('La double authentification n’est pas disponible sur cette instance.')).toBeTruthy();
    const onRevoked = vi.fn();
    rerender(<SessionsSection data={{ profile: { first_name: 'A', last_name: 'B', email: 'a@b', phone: null }, sessions: [], sources: { sessions: 'unavailable', preferences: 'available', notifications: 'available' } }} onRevoked={onRevoked} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeTruthy(); expect(screen.getByText('Les sessions sont temporairement indisponibles.')).toBeTruthy();
  });
});

describe('Preferences and system cards', () => {
  it('keeps « Par défaut » for a null preference and an unknown current value selectable', async () => {
    const user = userEvent.setup(); const onChange = vi.fn();
    const { rerender } = render(<PreferenceSelect label="Thème" value={null} options={[['light', 'Clair'], ['dark', 'Sombre']]} onChange={onChange} />);
    expect((screen.getByLabelText('Thème')).value).toBe(''); expect(screen.getByRole('option', { name: 'Par défaut' })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Thème'), 'dark'); expect(onChange).toHaveBeenCalledWith('dark');
    rerender(<PreferenceSelect label="Thème" value="sepia" options={[['light', 'Clair']]} onChange={onChange} />);
    expect(screen.getByRole('option', { name: 'sepia' })).toBeTruthy();
  });
  it('bounds the appearance preview between 12 and 24 px', () => {
    render(<AppearancePreview appearance={{ theme: 'dark', font_family: 'Georgia', font_size: 40, density: 'compact' }} />);
    const preview = screen.getByLabelText('Aperçu de l’apparence');
    expect(preview.style.fontSize).toBe('24px'); expect(preview.style.padding).toBe('8px'); expect((preview).getAttribute('data-preview-theme')).toBe('dark');
  });
  it('exposes the diagnostic download and the local browser information', async () => {
    const user = userEvent.setup(); const onDownload = vi.fn();
    render(<><DiagnosticSection onDownload={onDownload} /><BrowserInformation /></>);
    await user.click(screen.getByRole('button', { name: 'Télécharger le diagnostic local' })); expect(onDownload).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 3, name: 'Informations du navigateur actuel' })).toBeTruthy();
    expect(screen.getByText('Navigateur').nextElementSibling.textContent).not.toBe('');
  });
});
