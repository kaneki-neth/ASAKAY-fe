<script setup>
import { defineProps, defineEmits, defineModel, computed, ref } from 'vue'

const props = defineProps({
  value: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  paginator: { type: Boolean, default: true },
  rows: { type: Number, default: 10 },
  dataKey: { type: String, default: 'id' },
  rowHover: { type: Boolean, default: true },
  filterDisplay: { type: String, default: 'menu' },
  globalFilterFields: { type: Array, default: () => [] },
  showGridlines: { type: Boolean, default: true },
  skeletonRows: { type: Number, default: 8 }
})

const filters = defineModel('filters', {
  local: true,
  default: () => ({
    global: { value: null, matchMode: 'contains' }
  })
})

const emit = defineEmits(['clear'])

const first = ref(0)

const tableValue = computed(() => {
  if (props.loading && props.value.length === 0) {
    return Array.from({ length: props.skeletonRows }, (_, i) => ({ _skeleton_id: i }))
  }
  return props.value
})

const displayCount = computed(() => {
  if (props.loading) return 0
  return props.paginator ? Math.min(props.rows, props.value.length) : props.value.length
})
const totalCount = computed(() => (props.loading ? 0 : props.value.length))
</script>

<template>
  <DataTable
    :value="tableValue"
    :loading="false"
    :paginator="props.paginator"
    :rows="props.rows"
    :dataKey="props.dataKey"
    :rowHover="props.rowHover"
    v-model:filters="filters"
    :filterDisplay="props.filterDisplay"
    :globalFilterFields="props.globalFilterFields"
    :showGridlines="props.showGridlines"
    v-model:first="first"
  >
    <template #header>
      <div class="flex justify-between">
        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="emit('clear')" />
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
        </IconField>
      </div>
    </template>

    <template #empty>
      <div v-if="!props.loading" class="text-center text-gray-400">
        <slot name="empty">No records found.</slot>
      </div>
    </template>

    <slot />
  </DataTable>
  <div class="text-sm text-gray-500 mt-2">
    Showing {{ totalCount > 0 ? first + 1 : 0 }} - {{ Math.min(first + props.rows, totalCount) }} of {{ totalCount }} items
  </div>
</template>

<style scoped>
:deep(.p-datatable-table) {
    table-layout: auto;
    width: 100%;
}

:deep(.p-datatable-thead > tr > th),
:deep(.p-datatable-tbody > tr > td) {
    /* Set column size to only cater the width of the content */
    width: 1px;
    white-space: nowrap;

    /* Add a minimum width if the column is empty */
    min-width: 100px;

    /* Add a limit to avoid stretching column width if the content are long */
    max-width: 400px;

    /* Standard ellipsis for long content */
    text-overflow: ellipsis;
    overflow: hidden;
}

/* Ensure actions column or specific wide columns can still work if they have inline styles */
:deep(.p-datatable-tbody > tr > td.flex) {
    width: auto;
}
</style>
