<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createUser, getUser, updateUser, assignRoleToUser } from '@/service/users'
import { useToast } from 'primevue/usetoast'
import UserRolesManager from '@/components/UserRolesManager.vue'
import UserRolesSelector from '@/components/UserRolesSelector.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const id = computed(() => route.params.id as string | undefined)
const isCreate = computed(() => !id.value)
const loading = ref(false)
const form = ref<{ name: string; email: string; password?: string; confirmPassword?: string }>({ name: '', email: '', password: '', confirmPassword: '' })
const errors = ref<Record<string, string>>({})
const selectedRoleIds = ref<Array<number | string>>([])

onMounted(async () => {
  if (id.value) {
    loading.value = true
    try {
      const data = await getUser(id.value)
      form.value = {
        name: data?.name ?? '',
        email: data?.email ?? '',
        password: '',
        confirmPassword: ''
      }
    } finally {
      loading.value = false
    }
  }
})

watch(
  () => [form.value.password, form.value.confirmPassword],
  ([p, c]) => {
    // Clear if one of them is empty
    if (!p || !c) {
      delete errors.value.confirmPassword
      return
    }

    if (p !== c) {
      errors.value.confirmPassword = 'Passwords do not match'
    } else {
      delete errors.value.confirmPassword
    }
  }
)

function passwordsMismatch() {
  const { password, confirmPassword } = form.value
  return !!password && !!confirmPassword && password !== confirmPassword
}

function validate() {
  errors.value = {}
  if (!form.value.name?.trim()) {
    errors.value.name = 'Name is required'
  }
  
  if (!form.value.email?.trim()) {
    errors.value.email = 'Email is required'
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.value.email)) {
      errors.value.email = 'Email is invalid'
    }
  }

  if (isCreate.value) {
    if (!form.value.password || form.value.password.length < 6) {
      errors.value.password = 'Password must be at least 6 characters'
    }
  }

  if (form.value.password) {
    if (form.value.confirmPassword !== form.value.password) {
      errors.value.confirmPassword = 'Passwords do not match'
    }
  }

  // 🔒 HARD BLOCK — form will NOT submit if mismatch
  if (passwordsMismatch()) {
    errors.value.confirmPassword = 'Passwords do not match'
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
      email: form.value.email,
      password: form.value.password
    }
    if (id.value) {
      await updateUser(id.value, payload)
      toast.add({ severity: 'success', summary: 'Updated', detail: 'User updated', life: 2500 })
    } else {
      const created = await createUser(payload)
      const newId = created?.id ?? created?.data?.id
      if (newId && selectedRoleIds.value.length) {
        await Promise.all(selectedRoleIds.value.map(rid => assignRoleToUser(newId, rid)))
      }
      toast.add({ severity: 'success', summary: 'Created', detail: 'User created', life: 2500 })
    }
    router.push('/accounts/users')
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
  router.push('/accounts/users')
}
</script>

<template>
  <div class="card mx-auto">
    <div class="font-semibold text-xl mb-4">{{ isCreate ? 'New User' : 'Edit User' }}</div>
    <div class="grid gap-4">
      <form class="grid gap-4" @submit.prevent="save">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label>Name</label>
            <InputText v-model="form.name" :class="{'p-invalid': !!errors.name}" placeholder="Enter name" @input="clearError('name')" />
            <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
          </div>
          <div class="flex flex-col gap-2">
            <label>Email</label>
            <InputText v-model="form.email" :class="{'p-invalid': !!errors.email}" placeholder="Enter email" @input="clearError('email')" />
            <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label>Password</label>
            <Password class="w-full" input-class="w-full" v-model="form.password" toggleMask :feedback="false" :class="{'p-invalid': !!errors.password}" @input="clearError('password')" />
            <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
          </div>
          <div class="flex flex-col gap-2">
            <label>Confirm Password</label>
            <Password class="w-full" input-class="w-full" v-model="form.confirmPassword" toggleMask :feedback="false" :class="{'p-invalid': !!errors.confirmPassword}" />
            <small v-if="errors.confirmPassword" class="text-red-500">{{ errors.confirmPassword }}</small>
          </div>
        </div>
        <div v-if="isCreate" class="mt-4">
          <UserRolesSelector v-model:selectedIds="selectedRoleIds" />
        </div>
        <div class="flex gap-2 mt-2">
          <Button
            label="Save"
            icon="pi pi-check"
            :loading="loading"
            :disabled="passwordsMismatch()"
            @click="save"
          />
          <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined @click="cancel" />
        </div>
      </form>
    </div>
  </div>
  <Toast />
  <ConfirmDialog />
  <div v-if="id" class="mt-4 mx-auto">
    <UserRolesManager :user-id="id as string" />
  </div>
</template>
