import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabaseAuth } from '@/api/supabaseAuth';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const sdkClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Transitional compatibility seam:
// frontend auth is Supabase-native while Base44 entities/functions are migrated lane by lane.
export const base44 = new Proxy(sdkClient, {
  get(target, property, receiver) {
    if (property === 'auth') return supabaseAuth;
    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  }
});
