export function usePrivateRealtimePresence(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_REALTIME_PRIVATE === 'true';
}
