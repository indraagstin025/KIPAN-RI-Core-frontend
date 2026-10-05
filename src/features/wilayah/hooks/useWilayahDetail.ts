import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/apiClient';
import type { PengurusDetail } from '@/features/kepengurusan/types';
import { wilayahDetail, wilayahPengurus } from '../api/wilayahAdminService';
import type { WilayahAdminItem, WilayahDetail, WilayahType } from '../types';

export type DetailTab = 'info' | 'pengurus' | 'statistik' | 'activity';

// WilayahDetailApi menampung state modal detail wilayah + tab pengurus.
export interface WilayahDetailApi {
  detail: WilayahDetail | null;
  detailLoading: boolean;
  detailTab: DetailTab; setDetailTab: (v: DetailTab) => void;
  pengurusList: PengurusDetail[];
  pengurusAll: boolean; setPengurusAll: (v: boolean) => void;
  pengurusLoading: boolean;
  pengurusError: string | null;
  bukaDetail: (type: WilayahType, it: WilayahAdminItem) => Promise<void>;
  tutupDetail: () => void;
}

export function useWilayahDetail(onError: (msg: string | null) => void): WilayahDetailApi {
  const [detail, setDetail] = useState<WilayahDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [pengurusList, setPengurusList] = useState<PengurusDetail[]>([]);
  const [pengurusAll, setPengurusAll] = useState(false);
  const [pengurusLoading, setPengurusLoading] = useState(false);
  const [pengurusError, setPengurusError] = useState<string | null>(null);

  // Tab Pengurus memakai endpoint khusus (filter Aktif/Semua) — bukan data
  // ringkas dari /detail.
  const loadPengurus = useCallback(async () => {
    if (detailTab !== 'pengurus' || !detail) return;
    setPengurusLoading(true);
    setPengurusError(null);
    try {
      setPengurusList(await wilayahPengurus(detail.type as WilayahType, detail.id, pengurusAll));
    } catch (e: unknown) {
      setPengurusError(e instanceof ApiError ? e.message : 'Gagal memuat pengurus wilayah');
    } finally {
      setPengurusLoading(false);
    }
  }, [detailTab, detail, pengurusAll]);

  useEffect(() => {
    void loadPengurus();
  }, [loadPengurus]);

  async function bukaDetail(type: WilayahType, it: WilayahAdminItem): Promise<void> {
    onError(null);
    setDetailTab('info');
    setDetail(null);
    setPengurusAll(false);
    setPengurusList([]);
    setDetailLoading(true);
    try {
      setDetail(await wilayahDetail(type, it.id));
    } catch (e: unknown) {
      onError(e instanceof ApiError ? e.message : 'Gagal memuat detail wilayah');
    } finally {
      setDetailLoading(false);
    }
  }

  function tutupDetail(): void {
    setDetail(null);
    setDetailLoading(false);
  }

  return {
    detail, detailLoading, detailTab, setDetailTab,
    pengurusList, pengurusAll, setPengurusAll, pengurusLoading, pengurusError,
    bukaDetail, tutupDetail,
  };
}
