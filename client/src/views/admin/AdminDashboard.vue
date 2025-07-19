<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div class="stats-row">
        <div class="stat-card">
          <h3 class="stat-title">Total Cases</h3>
          <p class="stat-number">{{ cases.length }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Active Cases</h3>
          <p class="stat-number">{{ activeCases }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Pending Cases</h3>
          <p class="stat-number">{{ pendingCases }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Resolved Cases</h3>
          <p class="stat-number">{{ resolvedCases }}</p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading cases...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p class="text-red-600">{{ error }}</p>
      <button @click="loadCases" class="retry-btn">Retry</button>
    </div>

    <!-- Cases table -->
    <div v-else class="cases-section">
      <div class="section-header">
        <h2 class="text-xl font-semibold text-gray-700">All Cases</h2>
        <div class="search-bar">
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="Search cases..." 
            class="search-input"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="cases-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Complainant</th>
              <th>Respondent</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date Filed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="caseItem in filteredCases" :key="caseItem.id" class="case-row">
              <td class="case-id">{{ caseItem.id.substring(0, 8) }}...</td>
              <td class="complainant">
                {{ caseItem.complainant_first_name }} {{ caseItem.complainant_last_name }}
                <div class="email">{{ caseItem.complainant_email }}</div>
              </td>
              <td class="respondent">{{ caseItem.respondent_name }}</td>
              <td class="category">
                <span class="category-badge">{{ caseItem.case_category }}</span>
              </td>
              <td class="status">
                <span :class="getStatusClass(normalizeStatus(caseItem.status))">{{ normalizeStatus(caseItem.status) }}</span>
              </td>
              <td class="date">{{ formatDate(caseItem.created_at) }}</td>
              <td class="actions">
                <router-link 
                  :to="`/case/${caseItem.id}`" 
                  class="view-btn"
                  title="View Case"
                >
                  👁️
                </router-link>
                <button 
                  @click="editCase(caseItem)" 
                  class="edit-btn"
                  title="Edit Case"
                >
                  ✏️
                </button>
                <button 
                  @click="confirmDelete(caseItem)" 
                  class="delete-btn"
                  title="Delete Case"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredCases.length === 0" class="no-cases">
          <p>No cases found.</p>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">Confirm Delete</h3>
        <p class="modal-message">
          Are you sure you want to delete this case?<br>
          <strong>{{ caseToDelete?.case_title }}</strong><br>
          This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="cancel-btn">Cancel</button>
          <button @click="deleteCase" class="confirm-delete-btn" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../../services/authService.js'

const router = useRouter()

// Reactive data
const cases = ref([])
const loading = ref(true)
const error = ref('')
const searchTerm = ref('')
const showDeleteModal = ref(false)
const caseToDelete = ref(null)
const deleting = ref(false)

// Helper function to normalize case status
const normalizeStatus = (status) => {
  if (!status) return 'Pending' // Default status for cases without status
  
  // Normalize common status variations
  const statusMap = {
    'pending': 'Pending',
    'under review': 'Under Review',
    'in progress': 'In Progress', 
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'terminated': 'Terminated',
    'filed': 'Pending', // Filed cases are typically pending
    'submitted': 'Pending'
  }
  
  const normalizedKey = status.toLowerCase().trim()
  return statusMap[normalizedKey] || status // Return original if no mapping found
}

// Computed properties
const filteredCases = computed(() => {
  if (!searchTerm.value) return cases.value
  
  const term = searchTerm.value.toLowerCase()
  return cases.value.filter(caseItem => 
    caseItem.case_title?.toLowerCase().includes(term) ||
    caseItem.complainant_first_name?.toLowerCase().includes(term) ||
    caseItem.complainant_last_name?.toLowerCase().includes(term) ||
    caseItem.complainant_email?.toLowerCase().includes(term) ||
    caseItem.respondent_name?.toLowerCase().includes(term) ||
    caseItem.case_category?.toLowerCase().includes(term) ||
    normalizeStatus(caseItem.status)?.toLowerCase().includes(term)
  )
})

const activeCases = computed(() => {
  return cases.value.filter(caseItem => {
    const status = normalizeStatus(caseItem.status)
    return status === 'Under Review' || status === 'In Progress'
  }).length
})

const pendingCases = computed(() => {
  return cases.value.filter(caseItem => {
    const status = normalizeStatus(caseItem.status)
    return status === 'Pending'
  }).length
})

const resolvedCases = computed(() => {
  return cases.value.filter(caseItem => {
    const status = normalizeStatus(caseItem.status)
    return status === 'Resolved' || status === 'Closed'
  }).length
})

// Methods
const loadCases = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await authService.getAdminCases()
    cases.value = response.cases || []
    
    // Debug: Log status information
    if (cases.value.length > 0) {
      const statusCounts = {}
      cases.value.forEach(caseItem => {
        const originalStatus = caseItem.status || 'undefined'
        const normalizedStatus = normalizeStatus(caseItem.status)
        
        if (!statusCounts[normalizedStatus]) {
          statusCounts[normalizedStatus] = { count: 0, original: new Set() }
        }
        statusCounts[normalizedStatus].count++
        statusCounts[normalizedStatus].original.add(originalStatus)
      })
      
      console.log('Case status summary:', statusCounts)
    }
  } catch (err) {
    console.error('Failed to load cases:', err)
    error.value = 'Failed to load cases. Please try again.'
  } finally {
    loading.value = false
  }
}

const confirmDelete = (caseItem) => {
  caseToDelete.value = caseItem
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  caseToDelete.value = null
}

const editCase = (caseItem) => {
  router.push(`/admin/case/${caseItem.id}/edit`)
}

const deleteCase = async () => {
  if (!caseToDelete.value) return
  
  try {
    deleting.value = true
    await authService.deleteCase(caseToDelete.value.id)
    
    // Remove from local list
    cases.value = cases.value.filter(caseItem => caseItem.id !== caseToDelete.value.id)
    
    showDeleteModal.value = false
    caseToDelete.value = null
  } catch (err) {
    console.error('Failed to delete case:', err)
    alert('Failed to delete case. Please try again.')
  } finally {
    deleting.value = false
  }
}

const getStatusClass = (status) => {
  const statusClasses = {
    'Pending': 'status-pending',
    'Under Review': 'status-review',
    'In Progress': 'status-progress',
    'Resolved': 'status-resolved',
    'Closed': 'status-closed',
    'Terminated': 'status-terminated'
  }
  return statusClasses[status] || 'status-default'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadCases()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 30px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.loading-container, .error-container {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: #3b82f6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
}

.cases-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 250px;
}

.table-container {
  overflow-x: auto;
}

.cases-table {
  width: 100%;
  border-collapse: collapse;
}

.cases-table th {
  background: #f8fafc;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.cases-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #000000;
}

.case-row:hover {
  background: #f8fafc;
}

.case-id {
  font-family: monospace;
  font-size: 12px;
  color: #000000;
}

.complainant {
  color: #000000;
}

.complainant .email {
  font-size: 12px;
  color: #374151;
}

.respondent {
  color: #000000;
}

.category {
  color: #000000;
}

.category-badge {
  background: #e0f2fe;
  color: #0277bd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-pending { color: #f59e0b; }
.status-review { color: #3b82f6; }
.status-progress { color: #8b5cf6; }
.status-resolved { color: #10b981; }
.status-closed { color: #6b7280; }
.status-terminated { color: #d32f2f; font-weight: bold; }
.status-default { color: #ef4444; font-weight: bold; }

.actions {
  display: flex;
  gap: 8px;
}

.view-btn, .edit-btn, .delete-btn {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}

.view-btn {
  background: #e0f2fe;
  color: #0277bd;
}

.edit-btn {
  background: #f3e8ff;
  color: #7c3aed;
}

.delete-btn {
  background: #fee2e2;
  color: #dc2626;
}

.no-cases {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.modal-message {
  margin-bottom: 20px;
  color: #374151;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-delete-btn {
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 