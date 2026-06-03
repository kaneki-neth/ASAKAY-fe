<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { listRoles, deleteRole } from '@/service/roles'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, fetchProfile } = usePermissions()
const roles = ref<any[]>([])
const filters = ref<any>(null)
const loading = ref<boolean>(true)
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

function initFilters() {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
  }
}
initFilters()

onBeforeMount(async () => {
  loading.value = true
  try {
    await fetchProfile()
    await fetchRoles()
  } catch (e) {
    console.error('Initialization error', e)
  } finally {
    loading.value = false
  }
})

async function fetchRoles() {
  loading.value = true
  try {
    roles.value = await listRoles()
  } catch (e) {
    roles.value = []
  } finally {
    loading.value = false
  }
}

function clearFilter() {
  initFilters()
}

function formatDate(value: any) {
  const d = value ? new Date(value) : null
  return d ? d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
}

function goCreate() {
  router.push('/accounts/roles/new')
}
function goView(row: any) {
  router.push(`/accounts/roles/${row.id}`)
}
function goEdit(row: any) {
  router.push(`/accounts/roles/${row.id}/edit`)
}
function confirmDeleteRow(row: any) {
  confirm.require({
    message: 'Delete this role?',
    header: 'Confirm',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    accept: async () => {
      loading.value = true
      try {
        await deleteRole(row.id)
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted', life: 2500 })
        await fetchRoles()
      } finally {
        loading.value = false
        confirm.close()
      }
    }
  })
}
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <div class="font-semibold text-xl">Roles</div>
      <Button v-if="hasPermission('can_create_roles')" label="New Role" icon="pi pi-plus" @click="goCreate" />
    </div>
    <AppDataTable
      :value="roles"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="['name']"
      @clear="clearFilter"
    >
      <template #empty> No roles found. </template>
      <Column field="name" header="Name">
        <template #body="{ data }">
          <Skeleton v-if="loading" class="block" height="1.5rem" />
          <template v-else>{{ data.name }}</template>
        </template>
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
        </template>
      </Column>
      <Column field="created_at" header="Created" dataType="date">
        <template #body="{ data }">
          <Skeleton v-if="loading" class="block" height="1.5rem" />
          <template v-else>{{ formatDate(data.created_at) }}</template>
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" outlined @click="goView(data)" />
            <Button v-if="hasPermission('can_edit_roles')" icon="pi pi-pencil" outlined @click="goEdit(data)" />
            <Button v-if="hasPermission('can_delete_roles')" icon="pi pi-trash" severity="danger" outlined @click="confirmDeleteRow(data)" />
          </div>
        </template>
      </Column>
    </AppDataTable>
  </div>
</template>
