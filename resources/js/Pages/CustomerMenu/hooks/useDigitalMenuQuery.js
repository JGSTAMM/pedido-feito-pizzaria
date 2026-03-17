import { useCallback, useEffect, useState } from 'react';
import { fetchDigitalCatalog } from '../services/customerMenuApi';

export function useDigitalMenuQuery() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadCatalog = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const payload = await fetchDigitalCatalog();
            setData(payload);
        } catch (requestError) {
            setError(requestError);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    return {
        data,
        error,
        isLoading,
        refetch: loadCatalog,
    };
}
