<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { listPermissions } from '@/service/permissions/permissions'
import { assignPermissionToRole, removePermissionFromRole, getRole } from '@/service/roles/roles'

const props = defineProps<{
  roleId: string | number
  assignedPermissionIds?: Array<number | string>
}>()

const toast = useToast()
const loading = ref(false)
const permissions = ref<Array<{ id: number | string; name: string; description?: string }>>([])
const assigned = ref<Set<number | string>>(new Set())
const rowsPerPage = 8
const first = ref(0)
const totalCount = computed(() => (loading.value ? 0 : permissions.value.length))

onMounted(async () => {
  loading.value = true
  try {
    const list = await listPermissions()
    permissions.value = Array.isArray(list) ? list : []

    if (props.assignedPermissionIds && props.assignedPermissionIds.length) {
      assigned.value = new Set(props.assignedPermissionIds)
    } else {
      const r = await getRole(props.roleId)
      const rolePerms =
        (r?.permissions && Array.isArray(r.permissions) ? r.permissions : []) ||
        (r?.data?.permissions && Array.isArray(r.data.permissions) ? r.data.permissions : [])
      const ids = rolePerms.map((p: any) => p.id)
      assigned.value = new Set(ids)
    }
  } finally {
    loading.value = false
  }
})

function isAssigned(permissionId: number | string) {
  return assigned.value.has(permissionId)
}

async function assign(permissionId: number | string) {
  loading.value = true
  try {
    await assignPermissionToRole(props.roleId, permissionId)
    assigned.value.add(permissionId)
    toast.add({ severity: 'success', summary: 'Assigned', detail: 'Permission assigned', life: 2000 })
  } finally {
    loading.value = false
  }
}

async function remove(permissionId: number | string) {
  loading.value = true
  try {
    await removePermissionFromRole(props.roleId, permissionId)
    assigned.value.delete(permissionId)
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Permission removed', life: 2000 })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Manage Permissions</div>
    <DataTable
      :value="permissions"
      :loading="loading"
      :paginator="true"
      :rows="8"
      :dataKey="'id'"
      :rowHover="true"
      :showGridlines="true"
      v-model:first="first"
    >
      <Column field="name" header="Permission" style="min-width: 16rem">
        <template #body="{ data }">
          {{ data.name }}
        </template>
      </Column>
      <Column field="description" header="Description" style="min-width: 16rem">
        <template #body="{ data }">
          {{ data.description }}
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
        <div class="text-center text-gray-400">No permissions found.</div>
      </template>
    </DataTable>
    <div class="text-sm text-gray-500 mt-2">Showing {{ totalCount > 0 ? first + 1 : 0 }} - {{ Math.min(first + rowsPerPage, totalCount) }} of {{ totalCount }} items</div>
    <Toast />
  </div>
</template>
