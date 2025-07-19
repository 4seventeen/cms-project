<template>
  <div class="admin-edit-case">
    <div v-if="loading" class="loading-state">
      <p>Loading case details...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <Button variant="primary" @click="$router.push('/admin/dashboard')">
        Back to Admin Dashboard
      </Button>
    </div>
    
    <div v-else-if="caseData" class="edit-content">
      <div class="edit-header">
        <h1>Edit Case (Admin)</h1>
        <div class="edit-actions">
          <Button variant="secondary" @click="$router.push(`/case/${caseData.id}`)">
            View Case
          </Button>
          <Button variant="secondary" @click="$router.push('/admin/dashboard')">
            Back to Dashboard
          </Button>
        </div>
      </div>
      
      <div class="form-grid">
        <!-- Case Details Update -->
        <Card title="Update Case Details">
          <form @submit.prevent="handleSubmit">
            <FormInput
              v-model="form.case_description"
              label="Case Description"
              type="textarea"
              placeholder="Describe the complaint in detail..."
              required
              :disabled="submitting"
              :error="errors.case_description"
              :rows="6"
            />
            
            <!-- Admin Status Control -->
            <div class="form-group">
              <label for="status" class="form-label">Case Status</label>
              <select 
                id="status"
                v-model="form.status"
                class="form-select"
                :disabled="submitting"
                :class="{ 'error': errors.status }"
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="terminated">Terminated</option>
              </select>
              <span v-if="errors.status" class="error-text">{{ errors.status }}</span>
            </div>
            
            <!-- Case Type -->
            <FormInput
              v-model="form.case_type"
              label="Case Type"
              type="text"
              placeholder="e.g., Theft and Robbery, Domestic Violence"
              :disabled="submitting"
              :error="errors.case_type"
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
        
        <!-- Case Information (Read Only) -->
        <Card title="Case Information">
          <div class="case-info">
            <div class="info-row">
              <span class="info-label">Case ID:</span>
              <span class="info-value">{{ caseData.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Current Status:</span>
              <span class="info-value">
                <CaseStatus :status="caseData.status || 'pending'" />
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Complainant:</span>
              <span class="info-value">
                {{ caseData.complainant_first_name }} {{ caseData.complainant_last_name }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">{{ caseData.complainant_email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Respondent:</span>
              <span class="info-value">{{ caseData.respondent_name || 'N/A' }}</span>
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
      </div>
      
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
import authService from '../../services/authService.js'
import Card from '../../components/common/Card.vue'
import FormInput from '../../components/common/FormInput.vue'
import Button from '../../components/common/Button.vue'
import CaseStatus from '../../components/case/CaseStatus.vue'

const route = useRoute()
const router = useRouter()
const caseData = ref(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const submitError = ref('')
const success = ref('')

const form = ref({
  case_description: '',
  status: '',
  case_type: ''
})

const errors = ref({
  case_description: '',
  status: '',
  case_type: ''
})

onMounted(async () => {
  await loadCase()
})

const loadCase = async () => {
  try {
    const caseId = route.params.id
    const response = await authService.getAdminCase(caseId)
    caseData.value = response.case
    
    // Populate form with current values
    form.value.case_description = response.case.case_description || ''
    form.value.status = response.case.status || ''
    form.value.case_type = response.case.case_type || ''
  } catch (err) {
    console.error('Error loading case:', err)
    
    if (err.response?.status === 404) {
      error.value = 'Case not found'
    } else if (err.response?.status === 401 || err.response?.status === 403) {
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
    case_description: '',
    status: '',
    case_type: ''
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
  
  if (!form.value.status) {
    errors.value.status = 'Status is required'
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
      case_description: form.value.case_description.trim(),
      status: form.value.status,
      case_type: form.value.case_type.trim() || null
    }
    
    const response = await authService.updateAdminCase(caseData.value.id, payload)
    
    success.value = 'Case updated successfully! Redirecting to case details...'
    
    // Update local case data
    caseData.value = response.case
    
    // Redirect after showing success message
    setTimeout(() => {
      router.push(`/case/${caseData.value.id}`)
    }, 2000)
  } catch (err) {
    console.error('Error updating case:', err)
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
.admin-edit-case {
  max-width: 1200px;
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
  font-size: 28px;
}

.edit-actions {
  display: flex;
  gap: 15px;
}

.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.form-select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #333;
  transition: border-color 0.2s;
}

.form-select option {
  background: white;
  color: #333;
  padding: 8px;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-select.error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
  margin-top: 2px;
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
  font-weight: 500;
  color: #666;
}

.info-value {
  color: #333;
  text-align: right;
}

.error-message {
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: center;
}

.success-message {
  color: #155724;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: center;
}
</style> 