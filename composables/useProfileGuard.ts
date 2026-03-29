/**
 * Vérifie si le profil de l'utilisateur courant est complet (nom + rôle requis).
 * Charge le profil depuis Supabase à la première invocation.
 */
export function useProfileGuard() {
  const client = useSupabaseClient()

  const profile = ref<{ name: string; role: string; avatar_url: string | null } | null>(null)
  const profileLoading = ref(true)

  const isProfileComplete = computed(
    () => !!(profile.value?.name?.trim() && profile.value?.role?.trim())
  )

  onMounted(async () => {
    const { data: { user } } = await client.auth.getUser()
    if (!user?.id) {
      profileLoading.value = false
      return
    }

    const { data } = await client
      .from('profiles')
      .select('name, role, avatar_url')
      .eq('id', user.id)
      .single()

    profile.value = data ?? { name: '', role: '', avatar_url: null }
    profileLoading.value = false
  })

  return { profile, profileLoading, isProfileComplete }
}
