import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token from localStorage if it exists
  const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  // Set up headers with content type and authorization if token exists
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {})
  };
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token from localStorage if it exists
    const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    // Set up headers with authorization if token exists
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    
    // Use the first element of queryKey as the URL string
    let url = queryKey[0] as string;
    
    // Extract any additional query parameters from other elements in the queryKey array
    if (queryKey.length > 1 && typeof queryKey[1] === 'object') {
      // Don't send objects as part of the URL, they should be handled differently
    }
    
    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
