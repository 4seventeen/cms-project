<template>
  <div class="edit-case">
    <div v-if="loading" class="loading-state">
      <p>Loading case details...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <Button variant="primary" @click="$router.push('/dashboard')">
        Back to Dashboard
      </Button>
    </div>
    
    <div v-else-if="caseData" class="edit-content">
      <div class="edit-header">
        <h1>Edit Case</h1>
        <div class="edit-actions">
          <Button variant="secondary" @click="$router.push(`/case/${caseData.id}`)">
            Cancel
          </Button>
        </div>
      </div>
      
      <Card title="Update Case Description">
        <form @submit.prevent="handleSubmit">
          <FormInput
            v-model="form.case_description"
            label="Case Description"
            type="textarea"
            placeholder="Describe your complaint in detail..."
            required
            :disabled="submitting"
            :error="errors.case_description"
            :rows="6"
          />
          
          <div class="form-actions">
            <Button
              type="submit"
              variant="success"
              :loading="submitting"
              loading-text="Updating..."
            >
              Update Case
            </Button>
            <Button
              type="button"
              variant="secondary"
              @click="$router.push(`/case/${caseData.id}`)"
              :disabled="submitting"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
      
      <Card title="Case Information (Read Only)">
        <div class="case-info">
          <div class="info-row">
            <span class="info-label">Case ID:</span>
            <span class="info-value">{{ caseData.id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <CaseStatus :status="caseData.status || 'open'" />
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Created:</span>
            <span class="info-value">{{ formatDate(caseData.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Last Updated:</span>
            <span class="info-value">{{ formatDate(caseData.updated_at) }}</span>
          </div>
        </div>
      </Card>
      
      <div v-if="submitError" class="error-message">
        {{ submitError }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCaseById, updateCase } from '../services/caseService.js'
import Card from '../components/common/Card.vue'
import FormInput from '../components/common/FormInput.vue'
import Button from '../components/common/Button.vue'
import CaseStatus from '../components/case/CaseStatus.vue'

const route = useRoute()
const router = useRouter()
const caseData = ref(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const submitError = ref('')
const success = ref('')

const form = ref({
  case_description: ''
})

const errors = ref({
  case_description: ''
})

onMounted(async () => {
  await loadCase()
})

const loadCase = async () => {
  try {
    const caseId = route.params.id
    const response = await getCaseById(caseId)
    caseData.value = response.case
    form.value.case_description = response.case.case_description
  } catch (err) {
    console.error('Error loading case:', err)
    
    if (err.response?.status === 404) {
      error.value = 'Case not found'
    } else if (err.response?.status === 401) {
      error.value = 'You are not authorized to edit this case'
    } else {
      error.value = 'Failed to load case details. Please try again.'
    }
    
    // Clear error after 10 seconds
    setTimeout(() => {
      if (error.value) {
        error.value = ''
      }
    }, 10000)
  } finally {
    loading.value = false
  }
}

const clearMessages = () => {
  submitError.value = ''
  success.value = ''
  errors.value = {
    case_description: ''
  }
}

const validateForm = () => {
  let isValid = true
  
  if (!form.value.case_description.trim()) {
    errors.value.case_description = 'Case description is required'
    isValid = false
  } else if (form.value.case_description.trim().length < 10) {
    errors.value.case_description = 'Case description must be at least 10 characters'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  clearMessages()
  
  if (!validateForm()) {
    return
  }
  
  submitting.value = true
  
  try {
    const payload = {
      case_description: form.value.case_description.trim()
    }
    
    const response = await updateCase(caseData.value.id, payload)
    
    success.value = 'Case updated successfully! Redirecting to case details...'
    
    // Update local case data
    caseData.value = response.case
    
    // Redirect after showing success message
    setTimeout(() => {
      router.push(`/case/${caseData.value.id}`)
    }, 2000)
  } catch (err) {
    const errorMessage = err.response?.data?.error || 'Failed to update case'
    submitError.value = errorMessage
    
    // Clear error after 5 seconds
    setTimeout(() => {
      if (submitError.value === errorMessage) {
        submitError.value = ''
      }
    }, 5000)
  } finally {
    submitting.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.edit-case {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-state {
  color: #721c24;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.edit-header h1 {
  color: #333;
  margin: 0;
}

.edit-actions {
  display: flex;
  gap: 15px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.case-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.info-value {
  color: #666;
  text-align: right;
  flex: 1;
}

.error-message {
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
}

.success-message {
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
}

@media (max-width: 768px) {
  .edit-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style> 