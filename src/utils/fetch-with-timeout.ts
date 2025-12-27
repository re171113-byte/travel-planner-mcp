// 타임아웃이 적용된 fetch 유틸리티

const DEFAULT_TIMEOUT = 10000; // 10초

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`요청 시간이 초과되었습니다. (${timeout / 1000}초)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
