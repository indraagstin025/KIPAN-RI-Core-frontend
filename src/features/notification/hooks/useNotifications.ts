import { useCallback, useEffect, useState } from 'react';
import { listMine, markRead } from '../api/notificationService';
import type { AppNotification } from '../types';

export function useNotifications(limit = 25) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMine(limit));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const read = useCallback(async (id: number) => {
    await markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const unread = items.filter((n) => !n.is_read).length;
  return { items, unread, loading, reload, read };
}
