<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createRole, getRole, updateRole } from '@/service/roles/roles'
import { useToast } from 'primevue/usetoast'
import RolePermissionsManager from '@/components/RolePermissionsManager.vue'
import RolePermissionsSelector from '@/components/RolePermissionsSelector.vue'
import { assignPermissionToRole } from '@/service/roles/roles'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const id = computed(() => route.params.id as string | undefined)
const isCreate = computed(() => !id.value)
const loading = ref(false)
const form = ref<{ name: string; description?: string }>({ name: '', description: '' })
const errors = ref<Record<string, string>>({})
const selectedPermissionIds = ref<Array<number | string>>([])

onMounted(async () => {
  if (id.value) {
    loading.value = true
    try {
      const data = await getRole(id.value)
      form.value = {
        name: data?.name ?? '',
        description: data?.description ?? ''
      }
    } finally {
      loading.value = false
    }
  }
})

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) {
    errors.value.name = 'Name is required'
  }
  return Object.keys(errors.value).length === 0
}

function clearError(field: string) {
  if (errors.value[field]) delete errors.value[field]
}

async function save() {
  loading.value = true
  try {
    if (!validate()) {
      loading.value = false
      return
    }
    const payload: any = {
      name: form.value.name,
      description: form.value.description || undefined
    }
    if (id.value) {
      await updateRole(id.value, payload)
      toast.add({ severity: 'success', summary: 'Updated', detail: 'Role updated', life: 2500 })
    } else {
      const created = await createRole(payload)
      const newId = created?.id ?? created?.data?.id
      if (newId && selectedPermissionIds.value.length) {
        await Promise.all(selectedPermissionIds.value.map(pid => assignPermissionToRole(newId, pid)))
      }
      toast.add({ severity: 'success', summary: 'Created', detail: 'Role created', life: 2500 })
    }
    router.push('/accounts/roles')
  } catch (e: any) {
    const errs = e?.response?.data?.errors
    if (errs && typeof errs === 'object') {
      const m: Record<string, string> = {}
      Object.keys(errs).forEach(k => {
        const v = (errs as any)[k]
        const msg = Array.isArray(v) ? v[0] : String(v)
        m[k] = msg
      })
      errors.value = m
    }
  } finally {
    loading.value = false
  }
}

function cancel() {
  router.push('/accounts/roles')
}
</script>

<template>
  <div class="card mx-auto">
    <div class="font-semibold text-xl mb-4">{{ isCreate ? 'New Role' : 'Edit Role' }}</div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label>Name</label>
        <InputText v-model="form.name" :class="{'p-invalid': !!errors.name}" placeholder="Enter name" @input="clearError('name')" />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>
      <div class="flex flex-col gap-2 lg:col-span-2">
        <label>Description <span class="text-gray-400 text-sm">(optional)</span></label>
        <Textarea v-model="form.description" rows="3" autoResize placeholder="Enter description (optional)" />
      </div>
    </div>
    <div v-if="isCreate" class="mt-4 mx-auto">
      <RolePermissionsSelector v-model:selectedIds="selectedPermissionIds" />
    </div>
    <div class="flex gap-2 mt-2">
      <Button label="Save" icon="pi pi-check" :loading="loading" @click="save" />
      <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="cancel" />
    </div>
  </div>
  <Toast />
  <ConfirmDialog />
  <div v-if="id" class="mt-4 mx-auto">
    <RolePermissionsManager :role-id="id as string" />
  </div>
</template>
