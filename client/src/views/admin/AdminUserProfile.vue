<template>
  <div class="admin-user-profile">
    <!-- Back button -->
    <div class="back-nav">
      <button @click="goBack" class="back-btn">
        ← Back to Users
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading user profile...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p class="text-red-600">{{ error }}</p>
      <button @click="loadUserData" class="retry-btn">Retry</button>
    </div>

    <!-- User profile content -->
    <div v-else-if="user" class="profile-content">
      <!-- User header -->
      <div class="user-header">
        <div class="user-info">
          <h1 class="user-name">
            {{ user.first_name }} {{ user.last_name }}
            <span v-if="!user.first_name && !user.last_name" class="no-name">(No name provided)</span>
          </h1>
          <p class="user-email">{{ user.email }}</p>
          <div class="user-badges">
            <span :class="user.email_verified ? 'verified-badge' : 'unverified-badge'">
              {{ user.email_verified ? 'Email Verified' : 'Email Unverified' }}
            </span>
            <span class="cases-badge">{{ userCases.length }} Cases Filed</span>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-label">Joined</span>
            <span class="stat-value">{{ formatDate(user.created_at) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Login</span>
            <span class="stat-value">{{ user.last_login ? formatDate(user.last_login) : 'Never' }}</span>
          </div>
        </div>
      </div>

      <!-- Tab navigation -->
      <div class="tab-navigation">
        <button 
          :class="activeTab === 'profile' ? 'tab-active' : 'tab-inactive'"
          @click="activeTab = 'profile'"
        >
          Profile Details
        </button>
        <button 
          :class="activeTab === 'cases' ? 'tab-active' : 'tab-inactive'"
          @click="activeTab = 'cases'"
        >
          Cases ({{ userCases.length }})
        </button>
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <!-- Profile details tab -->
        <div v-if="activeTab === 'profile'" class="profile-details">
          <div class="details-card">
            <h3 class="card-title">Personal Information</h3>
            <div class="details-grid">
              <div class="detail-item">
                <label>First Name</label>
                <span>{{ user.first_name || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>Last Name</label>
                <span>{{ user.last_name || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>Email</label>
                <span>{{ user.email }}</span>
              </div>
              <div class="detail-item">
                <label>Phone</label>
                <span>{{ user.phone || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>Date of Birth</label>
                <span>{{ user.date_of_birth || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>Gender</label>
                <span>{{ user.gender || 'Not provided' }}</span>
              </div>
            </div>
          </div>

          <div class="details-card">
            <h3 class="card-title">Address Information</h3>
            <div class="details-grid">
              <div class="detail-item full-width">
                <label>Address</label>
                <span>{{ user.address || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>City</label>
                <span>{{ user.city || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>State</label>
                <span>{{ user.state || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>Postal Code</label>
                <span>{{ user.postal_code || 'Not provided' }}</span>
              </div>
              <div class="detail-item">
                <label>Country</label>
                <span>{{ user.country || 'Not provided' }}</span>
              </div>
            </div>
          </div>

          <div class="details-card">
            <h3 class="card-title">Account Information</h3>
            <div class="details-grid">
              <div class="detail-item">
                <label>Account Created</label>
                <span>{{ formatDateTime(user.created_at) }}</span>
              </div>
              <div class="detail-item">
                <label>Last Updated</label>
                <span>{{ formatDateTime(user.updated_at) }}</span>
              </div>
              <div class="detail-item">
                <label>Email Verified</label>
                <span :class="user.email_verified ? 'text-green-600' : 'text-red-600'">
                  {{ user.email_verified ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="detail-item">
                <label>Account Status</label>
                <span class="text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cases tab -->
        <div v-if="activeTab === 'cases'" class="cases-section">
          <div v-if="casesLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading user cases...</p>
          </div>

          <div v-else-if="casesError" class="error-container">
            <p class="text-red-600">{{ casesError }}</p>
            <button @click="loadUserCases" class="retry-btn">Retry</button>
          </div>

          <div v-else-if="userCases.length === 0" class="no-cases">
            <p>This user has not filed any cases yet.</p>
          </div>

          <div v-else class="cases-list">
            <div 
              v-for="caseItem in userCases" 
              :key="caseItem.id" 
              class="case-card"
              @click="viewCase(caseItem)"
            >
              <div class="case-header">
                <h4 class="case-title">{{ caseItem.case_title }}</h4>
                <span :class="getStatusClass(caseItem.status)">{{ caseItem.status }}</span>
              </div>
              <div class="case-details">
                <p><strong>Respondent:</strong> {{ caseItem.respondent_name }}</p>
                <p><strong>Category:</strong> {{ caseItem.case_category }}</p>
                <p><strong>Date Filed:</strong> {{ formatDate(caseItem.created_at) }}</p>
              </div>
              <div class="case-description">
                <p>{{ truncateText(caseItem.case_description, 150) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import authService from '../../services/authService.js'

const route = useRoute()
const router = useRouter()

// Reactive data
const user = ref(null)
const userCases = ref([])
const loading = ref(true)
const casesLoading = ref(false)
const error = ref('')
const casesError = ref('')
const activeTab = ref('profile')

// Get user ID from route params
const userId = route.params.id

// Methods
const loadUserData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Load user profile
    const userResponse = await authService.getAdminUser(userId)
    user.value = userResponse.user
    
    // Load user cases
    await loadUserCases()
    
  } catch (err) {
    console.error('Failed to load user data:', err)
    error.value = 'Failed to load user data. Please try again.'
  } finally {
    loading.value = false
  }
}

const loadUserCases = async () => {
  try {
    casesLoading.value = true
    casesError.value = ''
    
    const casesResponse = await authService.getAdminUserCases(userId)
    userCases.value = casesResponse.cases || []
    
  } catch (err) {
    console.error('Failed to load user cases:', err)
    casesError.value = 'Failed to load user cases. Please try again.'
  } finally {
    casesLoading.value = false
  }
}

const goBack = () => {
  router.push('/admin/manage-users')
}

const viewCase = (caseItem) => {
  router.push(`/case/${caseItem.id}`)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

const getStatusClass = (status) => {
  const statusClasses = {
    'Pending': 'status-pending',
    'Under Review': 'status-review',
    'In Progress': 'status-progress',
    'Resolved': 'status-resolved',
    'Closed': 'status-closed'
  }
  return statusClasses[status] || 'status-default'
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Watch for route changes (if navigating between users)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== userId) {
    window.location.reload() // Simple reload for now
  }
})

// Check for tab query param
onMounted(() => {
  const tabParam = route.query.tab
  if (tabParam === 'cases') {
    activeTab.value = 'cases'
  }
  loadUserData()
})
</script>

<style scoped>
.admin-user-profile {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.back-nav {
  margin-bottom: 20px;
}

.back-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
}

.back-btn:hover {
  background: #f1f5f9;
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

.user-header {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-name {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.no-name {
  color: #9ca3af;
  font-style: italic;
}

.user-email {
  color: #6b7280;
  margin-bottom: 12px;
}

.user-badges {
  display: flex;
  gap: 8px;
}

.verified-badge {
  background: #dcfce7;
  color: #166534;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.unverified-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.cases-badge {
  background: #e0f2fe;
  color: #0277bd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.user-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: right;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-weight: 500;
  color: #1f2937;
}

.tab-navigation {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.tab-active, .tab-inactive {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
}

.tab-active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-inactive {
  color: #6b7280;
}

.tab-inactive:hover {
  color: #374151;
}

.details-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-item span {
  color: #1f2937;
  font-weight: 400;
}

.no-cases {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.cases-list {
  display: grid;
  gap: 16px;
}

.case-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.case-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.case-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.case-details {
  margin-bottom: 12px;
}

.case-details p {
  margin: 4px 0;
  font-size: 14px;
  color: #6b7280;
}

.case-description {
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}

.status-pending { 
  background: #fef3c7;
  color: #f59e0b;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-review { 
  background: #dbeafe;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-progress { 
  background: #f3e8ff;
  color: #8b5cf6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-resolved { 
  background: #dcfce7;
  color: #10b981;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-closed { 
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
</style> 