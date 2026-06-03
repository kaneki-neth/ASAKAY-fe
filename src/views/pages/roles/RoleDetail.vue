<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRole } from '@/service/roles'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const role = ref<any>(null)
const permissions = computed(() => {
  const list =
    (role.value?.permissions && Array.isArray(role.value.permissions) ? role.value.permissions : []) ||
    (role.value?.data?.permissions && Array.isArray(role.value.data.permissions) ? role.value.data.permissions : [])
  return Array.isArray(list) ? list : []
})

onMounted(async () => {
  try {
    const data = await getRole(route.params.id as string)
    role.value = data
  } finally {
    loading.value = false
  }
})

function back() {
  router.push('/accounts/roles')
}
</script>

<template>
  <div class="card mx-auto">
    <div class="font-semibold text-xl mb-4">Role Details</div>
    <div v-if="loading" class="space-y-3 p-2">
      <Skeleton height="1.5rem"></Skeleton>
      <Skeleton height="1.5rem"></Skeleton>
    </div>
    <div v-else>
      <div class="grid grid-cols-2 gap-3">
        <div class="font-medium">Name</div>
        <div>{{ role?.name }}</div>
        <div class="font-medium">Description</div>
        <div>{{ role?.description || '-' }}</div>
        <div class="font-medium">Created</div>
        <div>{{ role?.created_at }}</div>
        <div class="font-medium">Permissions</div>
        <div>
          <template v-if="permissions.length">
            <div class="flex gap-2 flex-wrap">
              <Tag
                v-for="p in permissions"
                :key="p.id ?? p.name"
                :value="p.name"
                severity="info"
                class="mb-2"
              />
            </div>
          </template>
          <template v-else>-</template>
        </div>
      </div>
      <div class="mt-4">
        <Button label="Back" icon="pi pi-arrow-left" outlined @click="back" />
      </div>
    </div>
  </div>
</template>
