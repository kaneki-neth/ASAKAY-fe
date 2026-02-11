<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { listRoles } from '@/service/roles/roles'
import { assignRoleToUser, removeRoleFromUser, getUser } from '@/service/users/users'

const props = defineProps<{
  userId: string | number
  assignedRoleIds?: Array<number | string>
}>()

const toast = useToast()
const loading = ref(false)
const roles = ref<Array<{ id: number | string; name: string }>>([])
const assigned = ref<Set<number | string>>(new Set())

onMounted(async () => {
  loading.value = true
  try {
    const list = await listRoles()
    roles.value = Array.isArray(list) ? list : []

    if (props.assignedRoleIds && props.assignedRoleIds.length) {
      assigned.value = new Set(props.assignedRoleIds)
    } else {
      const u = await getUser(props.userId)
      const userRoles =
        (u?.roles && Array.isArray(u.roles) ? u.roles : []) ||
        (u?.data?.roles && Array.isArray(u.data.roles) ? u.data.roles : [])
      const ids = userRoles.map((r: any) => r.id)
      assigned.value = new Set(ids)
    }
  } finally {
    loading.value = false
  }
})

function isAssigned(roleId: number | string) {
  return assigned.value.has(roleId)
}

async function assign(roleId: number | string) {
  loading.value = true
  try {
    await assignRoleToUser(props.userId, roleId)
    assigned.value.add(roleId)
    toast.add({ severity: 'success', summary: 'Assigned', detail: 'Role assigned', life: 2000 })
  } finally {
    loading.value = false
  }
}

async function remove(roleId: number | string) {
  loading.value = true
  try {
    await removeRoleFromUser(props.userId, roleId)
    assigned.value.delete(roleId)
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Role removed', life: 2000 })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card mx-auto">
    <div class="font-semibold text-xl mb-4">Manage Roles</div>
    <DataTable :value="roles" :loading="loading" :paginator="true" :rows="8" :dataKey="'id'" :rowHover="true" :showGridlines="true">
      <Column field="name" header="Role" style="min-width: 16rem">
        <template #body="{ data }">
          {{ data.name }}
        </template>
      </Column>
      <Column header="Status" style="min-width: 10rem">
        <template #body="{ data }">
          <Tag :severity="isAssigned(data.id) ? 'success' : 'secondary'" :value="isAssigned(data.id) ? 'Assigned' : 'Available'" />
        </template>
      </Column>
      <Column header="Actions" style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button v-if="!isAssigned(data.id)" label="Assign" icon="pi pi-plus" size="small" @click="assign(data.id)" />
            <Button v-else label="Remove" icon="pi pi-minus" size="small" severity="danger" outlined @click="remove(data.id)" />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="text-center text-gray-400">No roles found.</div>
      </template>
    </DataTable>
    <Toast />
  </div>
</template>
