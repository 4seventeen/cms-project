<template>
  <div class="admin-manage-users">
    <div class="page-header">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Manage Users</h1>
      <div class="stats-row">
        <div class="stat-card">
          <h3 class="stat-title">Total Users</h3>
          <p class="stat-number">{{ users.length }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Active Users</h3>
          <p class="stat-number">{{ verifiedUsers }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Total Cases Filed</h3>
          <p class="stat-number">{{ totalCases }}</p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p class="text-red-600">{{ error }}</p>
      <button @click="loadUsers" class="retry-btn">Retry</button>
    </div>

    <!-- Users table -->
    <div v-else class="users-section">
      <div class="section-header">
        <h2 class="text-xl font-semibold text-gray-700">All Users</h2>
        <div class="search-bar">
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="Search users..." 
            class="search-input"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date Registered</th>
              <th>Last Login</th>
              <th>Email Verified</th>
              <th>Cases Filed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" class="user-row">
              <td class="name">
                <div class="user-name">
                  {{ user.first_name }} {{ user.last_name }}
                </div>
                <div v-if="!user.first_name && !user.last_name" class="no-name">
                  No name provided
                </div>
              </td>
              <td class="email">{{ user.email }}</td>
              <td class="phone">{{ user.phone || 'N/A' }}</td>
              <td class="date">{{ formatDate(user.created_at) }}</td>
              <td class="last-login">
                {{ user.last_login ? formatDate(user.last_login) : 'Never' }}
              </td>
              <td class="verified">
                <span :class="user.email_verified ? 'verified-badge' : 'unverified-badge'">
                  {{ user.email_verified ? 'Verified' : 'Unverified' }}
                </span>
              </td>
              <td class="case-count">
                <span class="case-count-badge">{{ user.case_count }}</span>
              </td>
              <td class="actions">
                <button 
                  @click="viewUserProfile(user)" 
                  class="view-btn"
                  title="View User Profile"
                >
                  👤
                </button>
                <button 
                  v-if="user.case_count > 0"
                  @click="viewUserCases(user)" 
                  class="cases-btn"
                  title="View User Cases"
                >
                  📋
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredUsers.length === 0" class="no-users">
          <p>No users found.</p>
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
const users = ref([])
const loading = ref(true)
const error = ref('')
const searchTerm = ref('')

// Computed properties
const filteredUsers = computed(() => {
  if (!searchTerm.value) return users.value
  
  const term = searchTerm.value.toLowerCase()
  return users.value.filter(user => 
    user.first_name?.toLowerCase().includes(term) ||
    user.last_name?.toLowerCase().includes(term) ||
    user.email?.toLowerCase().includes(term) ||
    user.phone?.includes(term)
  )
})

const verifiedUsers = computed(() => {
  return users.value.filter(user => user.email_verified).length
})

const totalCases = computed(() => {
  return users.value.reduce((total, user) => total + (parseInt(user.case_count) || 0), 0)
})

// Methods
const loadUsers = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await authService.getAdminUsers()
    users.value = response.users || []
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = 'Failed to load users. Please try again.'
  } finally {
    loading.value = false
  }
}

const viewUserProfile = (user) => {
  router.push(`/admin/users/${user.id}`)
}

const viewUserCases = (user) => {
  router.push(`/admin/users/${user.id}?tab=cases`)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-manage-users {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.users-section {
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

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8fafc;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.users-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #000000;
}

.user-row:hover {
  background: #f8fafc;
}

.user-name {
  font-weight: 500;
  color: #000000;
}

.no-name {
  color: #6b7280;
  font-style: italic;
  font-size: 14px;
}

.email {
  color: #000000;
}

.phone {
  color: #000000;
}

.date {
  color: #000000;
}

.last-login {
  color: #000000;
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

.case-count-badge {
  background: #e0f2fe;
  color: #0277bd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
}

.view-btn, .cases-btn {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.view-btn {
  background: #e0f2fe;
  color: #0277bd;
  title: "View Profile";
}

.cases-btn {
  background: #f3e8ff;
  color: #7c3aed;
  title: "View Cases";
}

.view-btn:hover, .cases-btn:hover {
  opacity: 0.8;
}

.no-users {
  text-align: center;
  padding: 40px;
  color: #64748b;
}
</style> 