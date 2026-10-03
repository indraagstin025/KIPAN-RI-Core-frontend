import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { Alert, Field, TextArea, TextInput } from '@/components/ui/fields';
import { Spinner } from '@/components/ui/loading';
import { Card, ErrorBox, Loading, PageHeader } from '@/components/ui/stateful';
import { ApiError } from '@/services/apiClient';
import { adminUpdateOrganisasi, getOrganisasi } from '../api/organisasiService';
import type { OrganisasiUpdateInput } from '../types';

const EMPTY: OrganisasiUpdateInput = {
  nama: '', singkatan: '', deskripsi: '', visi: '', misi: '', alamat: '', email: '',
  telepon: '', whatsapp: '', website: '', instagram: '', facebook: '', youtube: '', tiktok: '', logo_url: '',
};

export default function OrganisasiPage() {
  const [form, setForm] = useState<OrganisasiUpdateInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getOrganisasi();
      setForm({
        nama: p.nama, singkatan: p.singkatan, deskripsi: p.deskripsi, visi: p.visi, misi: p.misi,
        alamat: p.alamat, email: p.email, telepon: p.telepon, whatsapp: p.whatsapp, website: p.website,
        instagram: p.instagram, facebook: p.facebook, youtube: p.youtube, tiktok: p.tiktok, logo_url: p.logo_url,
      });
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat profil organisasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof OrganisasiUpdateInput>(k: K, v: string): void {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function simpan(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (form.nama.trim().length < 2) {
      setError('Nama organisasi wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      await adminUpdateOrganisasi(form);
      setOk('Profil organisasi tersimpan.');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan profil organisasi');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Profil Organisasi" desc="Kelola profil organisasi untuk halaman publik /profil." />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {ok && <div className="mb-4"><Alert kind="success">{ok}</Alert></div>}

      <form onSubmit={simpan} className="space-y-4">
        <Card>
          <p className="mb-3 text-sm font-bold text-kipan-text-dark">Identitas</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Organisasi" required>
              <TextInput value={form.nama} onChange={(v) => set('nama', v)} maxLength={150} id="org-nama" />
            </Field>
            <Field label="Singkatan">
              <TextInput value={form.singkatan} onChange={(v) => set('singkatan', v)} maxLength={50} id="org-sing" />
            </Field>
            <Field label="URL Logo">
              <TextInput value={form.logo_url} onChange={(v) => set('logo_url', v)} maxLength={500} id="org-logo" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Deskripsi">
              <TextArea value={form.deskripsi} onChange={(v) => set('deskripsi', v)} rows={3} id="org-desk" />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Visi">
              <TextArea value={form.visi} onChange={(v) => set('visi', v)} rows={3} id="org-visi" />
            </Field>
            <Field label="Misi (satu per baris)">
              <TextArea value={form.misi} onChange={(v) => set('misi', v)} rows={3} id="org-misi" />
            </Field>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-bold text-kipan-text-dark">Kontak & Media Sosial</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alamat"><TextInput value={form.alamat} onChange={(v) => set('alamat', v)} maxLength={500} id="org-alamat" /></Field>
            <Field label="Email"><TextInput value={form.email} onChange={(v) => set('email', v)} maxLength={150} id="org-email" /></Field>
            <Field label="Telepon"><TextInput value={form.telepon} onChange={(v) => set('telepon', v)} maxLength={50} id="org-tel" /></Field>
            <Field label="WhatsApp"><TextInput value={form.whatsapp} onChange={(v) => set('whatsapp', v)} maxLength={25} id="org-wa" /></Field>
            <Field label="Website"><TextInput value={form.website} onChange={(v) => set('website', v)} maxLength={255} id="org-web" /></Field>
            <Field label="Instagram"><TextInput value={form.instagram} onChange={(v) => set('instagram', v)} maxLength={255} id="org-ig" /></Field>
            <Field label="Facebook"><TextInput value={form.facebook} onChange={(v) => set('facebook', v)} maxLength={255} id="org-fb" /></Field>
            <Field label="YouTube"><TextInput value={form.youtube} onChange={(v) => set('youtube', v)} maxLength={255} id="org-yt" /></Field>
            <Field label="TikTok"><TextInput value={form.tiktok} onChange={(v) => set('tiktok', v)} maxLength={255} id="org-tt" /></Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? <span className="inline-flex items-center gap-2"><Spinner size={15} /> Menyimpan...</span> : 'Simpan Profil'}
          </Button>
        </div>
      </form>
    </div>
  );
}
