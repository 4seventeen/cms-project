<template>
  <div class="profile">
    <h1>Profile</h1>
    <p>Manage your account information</p>
    
    <Card title="User Information">
      <template v-if="loading">
        <p>Loading user information...</p>
      </template>
      <template v-else-if="error">
        <p>{{ error }}</p>
      </template>
      <template v-else>
        <div class="user-info">
          <div class="info-row"><span class="info-label">Email:</span><span class="info-value">{{ user?.email || '—' }}</span></div>
          <div class="info-row"><span class="info-label">User ID:</span><span class="info-value">{{ user?.id || '—' }}</span></div>
          <div class="info-row"><span class="info-label">First Name:</span><span class="info-value">{{ profile?.first_name || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Middle Name:</span><span class="info-value">{{ profile?.middle_name || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Last Name:</span><span class="info-value">{{ profile?.last_name || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Suffix:</span><span class="info-value">{{ profile?.suffix || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Sex:</span><span class="info-value">{{ profile?.sex || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">{{ profile?.date_of_birth || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">{{ profile?.phone || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Country:</span><span class="info-value">{{ profile?.country || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Province:</span><span class="info-value">{{ profile?.province || '—' }}</span></div>
          <div class="info-row"><span class="info-label">City:</span><span class="info-value">{{ profile?.city || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Barangay:</span><span class="info-value">{{ profile?.barangay || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Sitio/Purok/Subd.:</span><span class="info-value">{{ profile?.sitio_purok_subdivision || '—' }}</span></div>
          <div class="info-row"><span class="info-label">House & Street:</span><span class="info-value">{{ profile?.house_street || '—' }}</span></div>
          <div class="info-row"><span class="info-label">Account Created:</span><span class="info-value">{{ formatDate(user?.created_at) }}</span></div>
        </div>
      </template>
    </Card>

    <div class="actions">
      <Button variant="primary" @click="handleBackToDashboard">
        Back to Dashboard
      </Button>
      <Button variant="secondary" @click="handleEditProfile">Edit Profile</Button>
      <Button variant="danger" @click="signOut">Sign Out</Button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService.js'
import Card from '../components/common/Card.vue'
import Button from '../components/common/Button.vue'

const router = useRouter()
const user = ref(null)
const profile = ref(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  await loadUserInfo()
})

const loadUserInfo = async () => {
  try {
    // Get current user with profile data (this will check authentication)
    const response = await authService.getCurrentUser()
    if (response?.user) {
      user.value = response.user
      profile.value = response.user.profile
      
      // If no profile exists, redirect to complete profile
      if (!profile.value) {
        router.push('/complete-profile')
        return
      }
    } else {
      throw new Error('Failed to fetch user data')
    }
  } catch (err) {
    console.error('Profile error:', err)
    
    // If authentication failed, redirect to signin
    router.push('/signin')
    return
  } finally {
    loading.value = false
  }
}

const handleBackToDashboard = () => {
  // Check if user is admin and route appropriately
  if (user.value?.role === true) {
    router.push('/admin/dashboard')
  } else {
    router.push('/dashboard')
  }
}

const handleEditProfile = () => {
  // Check if user is admin and route appropriately
  if (user.value?.role === true) {
    router.push('/admin/edit-profile')
  } else {
    router.push('/edit-profile')
  }
}

const signOut = async () => {
  try {
    await authService.signout()
    router.push('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    // Redirect even if API call fails
    router.push('/signin')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 20px;
}

.user-info {
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
}

.loading-state, .no-data {
  text-align: center;
  color: #666;
  padding: 20px;
}

.actions {
  margin: 20px 0;
  display: flex;
  gap: 15px;
}

.error-message {
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
}
</style> 