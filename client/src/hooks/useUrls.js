import { useState, useCallback } from 'react';
import { shortenUrl, getAllUrls, deleteUrl } from '../utils/api';

export function useUrls() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchUrls = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUrls(page);
      setUrls(data.urls);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUrl = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await shortenUrl(payload);
      setUrls((prev) => {
        const exists = prev.find((u) => u.shortCode === data.shortCode);
        if (exists) return prev;
        return [data, ...prev];
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeUrl = useCallback(async (shortCode) => {
    try {
      await deleteUrl(shortCode);
      setUrls((prev) => prev.filter((u) => u.shortCode !== shortCode));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { urls, loading, error, pagination, fetchUrls, createUrl, removeUrl };
}
