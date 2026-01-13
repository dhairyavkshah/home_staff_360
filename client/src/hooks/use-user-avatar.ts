import { useState, useEffect } from "react";

const avatarCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

export function useUserAvatar(userId: string | undefined | null): {
  avatarUrl: string | null;
  isLoading: boolean;
} {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }

    if (avatarCache.has(userId)) {
      setAvatarUrl(avatarCache.get(userId) || null);
      return;
    }

    const fetchAvatar = async () => {
      if (pendingRequests.has(userId)) {
        const result = await pendingRequests.get(userId);
        setAvatarUrl(result || null);
        return;
      }

      setIsLoading(true);
      
      const request = fetch(`/api/user/avatar/${userId}`, { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) {
            return null;
          }
          const data = await res.json();
          return data.avatarData || null;
        })
        .catch(() => null);

      pendingRequests.set(userId, request);
      
      try {
        const result = await request;
        avatarCache.set(userId, result);
        setAvatarUrl(result);
      } finally {
        pendingRequests.delete(userId);
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [userId]);

  return { avatarUrl, isLoading };
}

export function prefetchAvatars(userIds: (string | undefined | null)[]): void {
  const validIds = userIds.filter((id): id is string => !!id && !avatarCache.has(id));
  
  validIds.forEach((userId) => {
    if (pendingRequests.has(userId)) return;
    
    const request = fetch(`/api/user/avatar/${userId}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.avatarData || null;
      })
      .catch(() => null);

    pendingRequests.set(userId, request);
    
    request.then((result) => {
      avatarCache.set(userId, result);
      pendingRequests.delete(userId);
    });
  });
}

export function clearAvatarCache(): void {
  avatarCache.clear();
}

export function invalidateAvatarCache(userId: string): void {
  avatarCache.delete(userId);
}
