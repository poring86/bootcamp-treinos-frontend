import { cookies } from "next/headers";

const getBody = <T>(c: Response | Request): Promise<T> => {
  return c.json() as Promise<T>;
};

const getUrl = (contextUrl: string): string => {
  const newUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}${contextUrl}`);
  const requestUrl = new URL(`${newUrl}`);
  return requestUrl.toString();
};

const getHeaders = async (headers?: HeadersInit): Promise<HeadersInit> => {
  const _cookies = await cookies();
  return {
    ...headers,
    cookie: _cookies.toString(),
  };
};

export const customFetch = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const requestUrl = getUrl(url);
  const requestHeaders = await getHeaders(options.headers);

  console.log("[customFetch] URL:", requestUrl);
  console.log("[customFetch] Cookies:", (requestHeaders as Record<string, string>).cookie);

  const requestInit: RequestInit = {
    ...options,
    headers: requestHeaders,
    credentials: "include",
    cache: "no-store",
  };

  try {
    const response = await fetch(requestUrl, requestInit);
    console.log("[customFetch] Response status:", response.status);
    const data = await getBody<T>(response);
    return { status: response.status, data, headers: response.headers } as T;
  } catch (error) {
    console.error("[customFetch] FETCH ERROR:", error);
    throw error;
  }
};
