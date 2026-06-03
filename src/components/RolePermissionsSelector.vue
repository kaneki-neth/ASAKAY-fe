<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { listPermissions } from '@/service/permissions'

const props = defineProps<{
  selectedIds?: Array<number | string>
}>()
const emit = defineEmits<{
  (e: 'update:selectedIds', value: Array<number | string>): void
}>()

const loading = ref(false)
const permissions = ref<Array<{ id: number | string; name: string; description?: string }>>([])
const selected = ref<Set<number | string>>(new Set(props.selectedIds || []))

onMounted(async () => {
  loading.value = true
  try {
    const list = await listPermissions()
    permissions.value = Array.isArray(list) ? list : []
  } finally {
    loading.value = false
  }
})

watch(
  () => props.selectedIds,
  (val) => {
    selected.value = new Set(val || [])
  }
)

function isSelected(id: number | string) {
  return selected.value.has(id)
}
function toggle(id: number | string) {
  if (selected.value.has(id)) {
    selected.value.delete(id)
  } else {
    selected.value.add(id)
  }
  emit('update:selectedIds', Array.from(selected.value))
}
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Select Permissions</div>
    <AppDataTable
      :value="permissions"
      :loading="loading"
      :paginator="true"
      :rows="8"
      :dataKey="'id'"
      :rowHover="true"
      :showGridlines="true"
    >
      <Column field="name" header="Permission">
        <template #body="{ data }">
          {{ data.name }}
        </template>
      </Column>
      <Column field="description" header="Description">
        <template #body="{ data }">
          {{ data.description }}
        </template>
      </Column>
      <Column header="Selected">
        <template #body="{ data }">
          <Tag :severity="isSelected(data.id) ? 'success' : 'secondary'" :value="isSelected(data.id) ? 'Yes' : 'No'" />
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button v-if="!isSelected(data.id)" label="Add" icon="pi pi-plus" size="small" @click="toggle(data.id)" />
            <Button v-else label="Remove" icon="pi pi-minus" size="small" severity="danger" outlined @click="toggle(data.id)" />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="text-center text-gray-400">No permissions found.</div>
      </template>
    </AppDataTable>
  </div>
</template>
