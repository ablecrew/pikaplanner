type QueryOptions = {
  cache?: RequestCache;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export async function querySupabase<T>(table: string, query = "select=*", options?: QueryOptions): Promise<T[]> {
  const config = getSupabaseConfig();
  if (!config) {
    return [];
  }

  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
    },
    cache: options?.cache ?? "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed Supabase query for ${table}: ${errorText}`);
  }

  return (await response.json()) as T[];
}