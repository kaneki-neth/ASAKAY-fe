<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser } from '@/service/users'
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { hasPermission, fetchProfile } = usePermissions()

const loading = ref(true)
const user = ref<any>(null)
const roles = computed(() => {
  const list =
    (user.value?.roles && Array.isArray(user.value.roles) ? user.value.roles : []) ||
    (user.value?.data?.roles && Array.isArray(user.value.data.roles) ? user.value.data.roles : [])
  return Array.isArray(list) ? list : []
})

onMounted(async () => {
  await fetchProfile()
  if (!hasPermission('can_view_users')) {
    toast.add({ severity: 'error', summary: 'Unauthorized', detail: 'You do not have permission to view users', life: 3000 })
    router.push('/dashboard')
    return
  }

  try {
    const data = await getUser(route.params.id as string)
    user.value = data
  } finally {
    loading.value = false
  }
})

function back() {
  router.push('/accounts/users')
}

function edit() {
  router.push(`/accounts/users/${route.params.id}/edit`)
}
</script>

<template>
  <div class="card mx-auto">
    <div class="font-semibold text-xl mb-4">User Details</div>
    <div v-if="loading" class="space-y-3 p-2">
      <Skeleton height="1.5rem"></Skeleton>
      <Skeleton height="1.5rem"></Skeleton>
      <Skeleton height="1.5rem"></Skeleton>
    </div>
    <div v-else>
      <div class="grid grid-cols-2 gap-3">
        <div class="font-medium">Name</div>
        <div>{{ user?.name }}</div>
        <div class="font-medium">Email</div>
        <div>{{ user?.email }}</div>
        <div class="font-medium">Created</div>
        <div>{{ user?.created_at }}</div>
        <div class="font-medium">Roles</div>
        <div>
          <template v-if="roles.length">
            <div class="flex gap-2 flex-wrap">
              <Tag
                v-for="r in roles"
                :key="r.id ?? r.name"
                :value="r.name"
                severity="info"
                class="mb-2"
              />
            </div>
          </template>
          <template v-else>-</template>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex gap-2">
          <Button label="Back" icon="pi pi-arrow-left" outlined @click="back" />
          <Button v-if="hasPermission('can_edit_users')" label="Edit" icon="pi pi-pencil" @click="edit" />
        </div>
      </div>
    </div>
  </div>
</template>
