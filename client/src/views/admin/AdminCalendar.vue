<template>
  <div class="admin-calendar">
    <div class="calendar-header">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">System-Wide Hearing Schedule</h1>
      <div class="calendar-controls">
        <!-- Future: Add filters for status, user, date range -->
        <div class="filters-placeholder">
          <button class="filter-btn" disabled title="Coming Soon">
            📅 Date Range
          </button>
          <button class="filter-btn" disabled title="Coming Soon">
            👤 By User
          </button>
          <button class="filter-btn" disabled title="Coming Soon">
            📊 By Status
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading hearing schedule...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <p class="text-red-600">{{ error }}</p>
      <button @click="loadHearings" class="retry-btn">Retry</button>
    </div>

    <!-- Calendar content -->
    <div v-else class="calendar-content">
      <!-- Summary stats -->
      <div class="stats-row">
        <div class="stat-card">
          <h3 class="stat-title">Total Hearings</h3>
          <p class="stat-number">{{ totalHearings }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">This Month</h3>
          <p class="stat-number">{{ thisMonthHearings }}</p>
        </div>
        <div class="stat-card">
          <h3 class="stat-title">Upcoming</h3>
          <p class="stat-number">{{ upcomingHearings }}</p>
        </div>
      </div>

      <!-- Hearings by month -->
      <div class="hearings-section">
        <div class="section-header">
          <h2 class="text-xl font-semibold text-gray-700">Upcoming Hearings</h2>
          <div class="view-toggle">
            <button 
              :class="viewMode === 'list' ? 'toggle-active' : 'toggle-inactive'"
              @click="viewMode = 'list'"
            >
              📋 List View
            </button>
            <button 
              :class="viewMode === 'calendar' ? 'toggle-active' : 'toggle-inactive'"
              @click="viewMode = 'calendar'"
              disabled
              title="Coming Soon"
            >
              📅 Calendar View
            </button>
          </div>
        </div>

        <!-- List view -->
        <div v-if="viewMode === 'list'" class="list-view">
          <div v-if="groupedHearings.length === 0" class="no-hearings">
            <p>No hearing schedules found in the system.</p>
            <p class="text-sm text-gray-500 mt-2">
              Hearings will appear here when cases include hearing schedule information.
            </p>
          </div>

          <div v-else class="hearings-list">
            <div 
              v-for="group in groupedHearings" 
              :key="group.date" 
              class="hearing-group"
            >
              <h3 class="group-date">{{ formatGroupDate(group.date) }}</h3>
              <div class="hearings-for-date">
                <div 
                  v-for="hearing in group.hearings" 
                  :key="hearing.id" 
                  class="hearing-card"
                  @click="viewHearingCase(hearing)"
                >
                  <div class="hearing-header">
                    <h4 class="hearing-title">{{ hearing.case_title }}</h4>
                    <span class="hearing-time">{{ formatTime(hearing.hearing_date) }}</span>
                  </div>
                  <div class="hearing-details">
                    <p><strong>Case ID:</strong> {{ hearing.id.substring(0, 8) }}...</p>
                    <p><strong>Complainant:</strong> {{ hearing.complainant_name || 'N/A' }}</p>
                    <p><strong>Respondent:</strong> {{ hearing.respondent_name }}</p>
                    <p><strong>Status:</strong> 
                      <span :class="getStatusClass(hearing.status)">{{ hearing.status }}</span>
                    </p>
                  </div>
                  <div v-if="hearing.hearing_location" class="hearing-location">
                    <p><strong>Location:</strong> {{ hearing.hearing_location }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar view (placeholder) -->
        <div v-if="viewMode === 'calendar'" class="calendar-view">
          <div class="coming-soon">
            <h3>📅 Calendar View Coming Soon</h3>
            <p>Visual calendar view with drag-and-drop scheduling will be available in a future update.</p>
          </div>
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
const hearings = ref([])
const loading = ref(true)
const error = ref('')
const viewMode = ref('list')

// Computed properties
const totalHearings = computed(() => {
  return hearings.value.length
})

const thisMonthHearings = computed(() => {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return hearings.value.filter(hearing => {
    if (!hearing.hearing_date) return false
    const hearingDate = new Date(hearing.hearing_date)
    return hearingDate.getMonth() === thisMonth && hearingDate.getFullYear() === thisYear
  }).length
})

const upcomingHearings = computed(() => {
  const now = new Date()
  return hearings.value.filter(hearing => {
    if (!hearing.hearing_date) return false
    return new Date(hearing.hearing_date) > now
  }).length
})

const groupedHearings = computed(() => {
  // Filter out hearings without dates and only show future hearings
  const futureHearings = hearings.value.filter(hearing => {
    if (!hearing.hearing_date) return false
    return new Date(hearing.hearing_date) > new Date()
  })

  // Group by date
  const groups = {}
  futureHearings.forEach(hearing => {
    const date = new Date(hearing.hearing_date).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(hearing)
  })

  // Convert to array and sort
  return Object.keys(groups)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(date => ({
      date,
      hearings: groups[date].sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date))
    }))
})

// Methods
const loadHearings = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Get all cases that have hearing dates
    const response = await authService.getAdminCases()
    
    // Filter cases that have hearing dates
    hearings.value = (response.cases || []).filter(caseItem => caseItem.hearing_date)
    
  } catch (err) {
    console.error('Failed to load hearings:', err)
    error.value = 'Failed to load hearing schedule. Please try again.'
  } finally {
    loading.value = false
  }
}

const viewHearingCase = (hearing) => {
  router.push(`/case/${hearing.id}`)
}

const formatGroupDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today - ' + date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow - ' + date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
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

// Lifecycle
onMounted(() => {
  loadHearings()
})
</script>

<style scoped>
.admin-calendar {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.calendar-header {
  margin-bottom: 30px;
}

.calendar-controls {
  margin-top: 20px;
}

.filters-placeholder {
  display: flex;
  gap: 12px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 14px;
  color: #9ca3af;
  cursor: not-allowed;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

.hearings-section {
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

.view-toggle {
  display: flex;
  gap: 8px;
}

.toggle-active, .toggle-inactive {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.toggle-inactive {
  color: #6b7280;
}

.toggle-inactive:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.no-hearings {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.hearings-list {
  padding: 20px;
}

.hearing-group {
  margin-bottom: 30px;
}

.group-date {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.hearings-for-date {
  display: grid;
  gap: 16px;
}

.hearing-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.hearing-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.hearing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.hearing-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.hearing-time {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.hearing-details {
  margin-bottom: 12px;
}

.hearing-details p {
  margin: 4px 0;
  font-size: 14px;
  color: #6b7280;
}

.hearing-location p {
  margin: 4px 0;
  font-size: 14px;
  color: #374151;
  font-style: italic;
}

.status-pending { color: #f59e0b; }
.status-review { color: #3b82f6; }
.status-progress { color: #8b5cf6; }
.status-resolved { color: #10b981; }
.status-closed { color: #6b7280; }

.coming-soon {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.coming-soon h3 {
  font-size: 20px;
  margin-bottom: 12px;
}
</style> 