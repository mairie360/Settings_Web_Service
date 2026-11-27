import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';

import { useProfileForm } from '@/components/SettingsPage/use-profile-form';
import { loadProfilePhoto, removeProfilePhoto, saveProfile, saveProfilePhoto } from '@/lib/settings-api';
import { toProfilePhoto } from '@/lib/profile-photo';

vi.mock('@/lib/settings-api', () => ({
  loadProfilePhoto: vi.fn(), removeProfilePhoto: vi.fn(), saveProfile: vi.fn(), saveProfilePhoto: vi.fn(),
}));
vi.mock('@/lib/profile-photo', () => ({ toProfilePhoto: vi.fn() }));

const profile = (overrides = {}) => ({ first_name: 'Anne', last_name: 'Le Gall', email: 'anne@mairie.test', phone: null, has_photo: false, ...overrides });
const webp = (label) => new Blob([label], { type: 'image/webp' });
const submit = { preventDefault() {} };

/** The hook with the page state it reads; `switchAccount` replays what the page does when another account signs in. */
function useHarness(initial) {
  const [data, setData] = useState({ profile: initial });
  const [current, setProfile] = useState(initial);
  const readRef = useRef(false);
  const savingRef = useRef(false);
  const confirmedProfileRef = useRef(initial);
  const accountChanged = useRef(() => {});
  const form = useProfileForm({
    data, setData, profile: current, setProfile, readRef, savingRef, confirmedProfileRef,
    registerAccountChanged: (listener) => { accountChanged.current = listener; },
  });
  const switchAccount = (next) => { setData({ profile: next }); setProfile(next); accountChanged.current(); };
  return { form, switchAccount };
}

beforeEach(() => {
  vi.mocked(loadProfilePhoto).mockReset().mockResolvedValue(null);
  vi.mocked(saveProfilePhoto).mockReset().mockResolvedValue(undefined);
  vi.mocked(removeProfilePhoto).mockReset().mockResolvedValue(undefined);
  vi.mocked(saveProfile).mockReset();
  vi.mocked(toProfilePhoto).mockReset();
  URL.createObjectURL = vi.fn((blob) => `blob:${blob.size}`);
  URL.revokeObjectURL = vi.fn();
});

describe('MAIR-1231 profile photo state', () => {
  it('MAIR-1231 a conversion that ends after « Annuler » does not bring the cancelled photo back', async () => {
    let finish;
    vi.mocked(toProfilePhoto).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useHarness(profile()));

    let picking;
    act(() => { picking = result.current.form.choosePhoto(new File(['x'], 'a.png', { type: 'image/png' })); });
    act(() => { result.current.form.updateProfile('first_name', 'Annie'); });
    act(() => { result.current.form.cancel(); });
    await act(async () => { finish(webp('cancelled')); await picking; });

    expect(result.current.form.photoUrl).toBeNull();
    expect(result.current.form.hasChanges).toBe(false);
  });

  it('MAIR-1231 only the last picked photo becomes the draft', async () => {
    const pending = [];
    vi.mocked(toProfilePhoto).mockImplementation(() => new Promise((resolve) => pending.push(resolve)));
    const { result } = renderHook(() => useHarness(profile()));

    let first; let second;
    act(() => { first = result.current.form.choosePhoto(new File(['1'], '1.png', { type: 'image/png' })); });
    act(() => { second = result.current.form.choosePhoto(new File(['22'], '2.png', { type: 'image/png' })); });
    await act(async () => { pending[1](webp('second')); await second; });
    await act(async () => { pending[0](webp('first-and-slow')); await first; });

    expect(result.current.form.photoUrl).toBe(`blob:${webp('second').size}`);
  });

  it('MAIR-1231 a refused photo stops being shown once a retry saves it', async () => {
    vi.mocked(toProfilePhoto).mockResolvedValue(webp('photo'));
    vi.mocked(saveProfilePhoto).mockRejectedValueOnce(new Error('Core API indisponible.'));
    const { result } = renderHook(() => useHarness(profile()));
    await act(async () => { await result.current.form.choosePhoto(new File(['x'], 'a.png', { type: 'image/png' })); });

    await act(async () => { await result.current.form.save(submit); });
    expect(result.current.form.photoError).toBe('Core API indisponible.');

    await act(async () => { await result.current.form.save(submit); });
    expect(result.current.form.photoError).toBeNull();
    expect(result.current.form.status).toBe('Votre profil a été enregistré.');
  });

  it('MAIR-1231 another account never shows the photo of the previous one', async () => {
    vi.mocked(loadProfilePhoto).mockResolvedValueOnce(webp('account-a')).mockResolvedValueOnce(webp('account-b!'));
    const { result } = renderHook(() => useHarness(profile({ has_photo: true })));
    await waitFor(() => expect(result.current.form.photoUrl).toBe(`blob:${webp('account-a').size}`));

    act(() => { result.current.switchAccount(profile({ email: 'bruno@mairie.test', has_photo: true })); });

    await waitFor(() => expect(result.current.form.photoUrl).toBe(`blob:${webp('account-b!').size}`));
    expect(loadProfilePhoto).toHaveBeenCalledTimes(2);
  });
});
