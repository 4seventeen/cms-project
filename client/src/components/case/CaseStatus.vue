<template>
  <span :class="statusClasses">{{ displayText }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['open', 'in progress', 'in-progress', 'resolved', 'closed', 'pending'].includes(value.toLowerCase())
  }
})

const normalised = computed(() => props.status.toLowerCase().replace(/[_\s]/g, '-'))

const statusClasses = computed(() => ({
  'status-badge': true,
  [`status-${normalised.value}`]: true
}))

const displayText = computed(() => {
  return props.status
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
})
</script>

<style scoped>
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-open {
  background: #e3f2fd;
  color: #1976d2;
}

.status-in-progress {
  background: #fff3e0;
  color: #f57c00;
}

.status-resolved {
  background: #e8f5e8;
  color: #388e3c;
}

.status-closed {
  background: #f5f5f5;
  color: #616161;
}

.status-pending {
  background: #e1f5fe;
  color: #0277bd;
}
</style> 