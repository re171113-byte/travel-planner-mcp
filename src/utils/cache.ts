// 간단한 인메모리 캐시 시스템
// TTL(Time-To-Live) 지원

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    // 기본 TTL: 5분
    this.defaultTTL = defaultTTLSeconds * 1000;

    // 주기적으로 만료된 캐시 정리 (10분마다)
    setInterval(() => this.cleanup(), 600000);
  }

  // 캐시 키 생성 (함수명 + 파라미터 해시)
  generateKey(prefix: string, params: Record<string, unknown>): string {
    const paramString = JSON.stringify(params);
    return `${prefix}:${this.simpleHash(paramString)}`;
  }

  // 간단한 해시 함수
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // 캐시에서 가져오기
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 만료 확인
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // 캐시에 저장
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiry = Date.now() + ttl;

    this.cache.set(key, { data, expiry });
  }

  // 캐시 삭제
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // 패턴으로 삭제 (prefix 기반)
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // 전체 캐시 비우기
  clear(): void {
    this.cache.clear();
  }

  // 만료된 캐시 정리
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // 캐시 통계
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // 캐시 래퍼 함수 - 캐시에 있으면 반환, 없으면 함수 실행 후 캐시
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttlSeconds);
    return data;
  }
}

// 캐시 TTL 설정 (초 단위)
export const CACHE_TTL = {
  SHORT: 60, // 1분 - 자주 변하는 데이터
  MEDIUM: 300, // 5분 - 일반 API 응답
  LONG: 1800, // 30분 - 좌표 등 거의 변하지 않는 데이터
  VERY_LONG: 3600, // 1시간 - 정적 데이터
} as const;

// 싱글톤 캐시 인스턴스
export const apiCache = new SimpleCache(CACHE_TTL.MEDIUM);

// 캐시 키 프리픽스
export const CACHE_KEYS = {
  COORDINATES: "coords",
  SEMAS_STORES: "semas",
  KAKAO_PLACES: "kakao",
  BIZINFO: "bizinfo",
} as const;
