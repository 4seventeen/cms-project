<template>
  <div class="case-card" @click="$emit('click', caseData)">
    <div class="case-header">
      <h3 class="case-title">{{ caseTitle }}</h3>
      <CaseStatus :status="caseData.status || 'open'" />
    </div>
    
    <div class="case-body">
      <p class="case-description">{{ caseDescription }}</p>
      
      <div class="case-meta">
        <div class="meta-item">
          <span class="meta-label">Case ID:</span>
          <span class="meta-value">{{ caseData.id }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Created:</span>
          <span class="meta-value">{{ formattedDate }}</span>
        </div>
        <div class="meta-item" v-if="caseData.respondents && caseData.respondents.length > 0">
          <span class="meta-label">Respondent:</span>
          <span class="meta-value">{{ respondentFullName }}</span>
        </div>
      </div>
    </div>
    
    <div class="case-footer">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CaseStatus from './CaseStatus.vue'

const props = defineProps({
  caseData: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const caseTitle = computed(() => {
  if (!props.caseData.case_description) return 'Untitled Case'
  return props.caseData.case_description.length > 50 
    ? props.caseData.case_description.substring(0, 50) + '...'
    : props.caseData.case_description
})

const caseDescription = computed(() => {
  if (!props.caseData.case_description) return 'No description available'
  return props.caseData.case_description.length > 150 
    ? props.caseData.case_description.substring(0, 150) + '...'
    : props.caseData.case_description
})

const formattedDate = computed(() => {
  if (!props.caseData.created_at) return 'N/A'
  return new Date(props.caseData.created_at).toLocaleDateString()
})

const respondentFullName = computed(() => {
  if (!props.caseData.respondents || !props.caseData.respondents.length) return '—'
  const r = props.caseData.respondents[0]
  return [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ')
})
</script>

<style scoped>
.case-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.case-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.case-title {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
  margin-right: 15px;
}

.case-body {
  margin-bottom: 15px;
}

.case-description {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.case-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  font-weight: 500;
}

.meta-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.case-footer {
  border-top: 1px solid #e9ecef;
  padding-top: 15px;
}
</style> 