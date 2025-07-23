<template>
  <div class="edit-profile">
    <div class="header">
      <h1 v-if="isAdminView">Edit User Profile</h1>
      <h1 v-else>Edit Profile</h1>
      <p v-if="isAdminView">Managing profile for {{ targetUser?.email }}</p>
      <p v-else>Update your profile information</p>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading profile information...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- Edit Form -->
    <Card v-else title="Profile Information">
      <form @submit.prevent="handleSubmit" class="edit-form">
        
        <!-- Personal Information Section -->
        <section v-if="isAdminView">
          <h2 class="section-title">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              v-model="form.first_name" 
              label="First Name" 
              required 
              :error="errors.first_name" 
            />
            <FormInput 
              v-model="form.middle_name" 
              label="Middle Name (optional)" 
              :error="errors.middle_name" 
            />
            <FormInput 
              v-model="form.last_name" 
              label="Last Name" 
              required 
              :error="errors.last_name" 
            />
            <FormInput 
              v-model="form.suffix" 
              label="Suffix (optional)" 
              :error="errors.suffix" 
            />
            
            <div class="form-group">
              <label class="input-label">Sex <span class="text-red-500">*</span></label>
              <select v-model="form.sex" class="input-base">
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <span v-if="errors.sex" class="error-text">{{ errors.sex }}</span>
            </div>
            
            <div class="form-group">
              <label class="input-label">Date of Birth <span class="text-red-500">*</span></label>
              <input type="date" v-model="form.date_of_birth" class="input-base" />
              <span v-if="errors.date_of_birth" class="error-text">{{ errors.date_of_birth }}</span>
            </div>
          </div>
        </section>

        <!-- Address Section (Admin Only) -->
        <section v-if="isAdminView">
          <h2 class="section-title">Address</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              v-model="form.country" 
              label="Country" 
              required 
              :error="errors.country" 
            />
            <FormInput 
              v-model="form.province" 
              label="Province" 
              required 
              :error="errors.province" 
            />
            <FormInput 
              v-model="form.city" 
              label="City / Municipality" 
              required 
              :error="errors.city" 
            />
            <FormInput 
              v-model="form.barangay" 
              label="Barangay" 
              required 
              :error="errors.barangay" 
            />
            <FormInput 
              v-model="form.sitio_purok_subdivision" 
              label="Sitio / Purok / Subdivision (optional)" 
              :error="errors.sitio_purok_subdivision" 
            />
            <FormInput 
              v-model="form.house_street" 
              label="House # & Street (optional)" 
              :error="errors.house_street" 
            />
          </div>
        </section>

        <!-- Contact Information Section -->
        <section>
          <h2 class="section-title">Contact Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput 
              v-model="form.email" 
              label="Email" 
              readonly 
              disabled
            />
            <FormInput 
              v-model="form.phone" 
              label="Phone Number" 
              required 
              :error="errors.phone" 
              placeholder="11-digit number"
            />
          </div>
        </section>

        <!-- User Restriction Notice -->
        <div v-if="!isAdminView" class="user-notice">
          <p>
            <strong>Note:</strong> You can only edit your phone number. 
            For other changes, please contact an administrator.
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="submitError" class="error-message">{{ submitError }}</div>

        <!-- Action Buttons -->
        <div class="actions">
          <Button 
            type="button" 
            variant="secondary" 
            @click="handleCancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            :loading="submitting" 
            loading-text="Saving..."
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authService from '../services/authService.js'
import Card from '../components/common/Card.vue'
import FormInput from '../components/common/FormInput.vue'
import Button from '../components/common/Button.vue'

const router = useRouter()
const route = useRoute()

// State
const currentUser = ref(null)
const targetUser = ref(null)
const error = ref('')
const loading = ref(true)
const submitting = ref(false)
const submitError = ref('')

// Form data
const form = reactive({
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  sex: '',
  date_of_birth: '',
  country: '',
  province: '',
  city: '',
  barangay: '',
  sitio_purok_subdivision: '',
  house_street: '',
  email: '',
  phone: ''
})

// Validation errors
const errors = reactive({})

// Computed properties
const isAdminView = computed(() => {
  // Admin view if user has admin role AND (editing another user OR editing their own profile via admin route)
  return currentUser.value?.role === true && (route.params.userId || route.path.startsWith('/admin'))
})

const targetUserId = computed(() => {
  return route.params.userId || currentUser.value?.id
})

// Load initial data
onMounted(async () => {
  await loadInitialData()
})

const loadInitialData = async () => {
  try {
    loading.value = true
    
    // Get current user for role checking
    const currentUserResponse = await authService.getCurrentUser()
    if (!currentUserResponse?.user) {
      throw new Error('Authentication required')
    }
    
    currentUser.value = currentUserResponse.user
    
    // Check if this is an admin editing another user's profile
    if (route.params.userId) {
      // Admin editing another user
      if (!currentUser.value.role) {
        throw new Error('Admin access required')
      }
      
      // Use authService instead of direct fetch to avoid JSON parsing errors
      try {
        const userData = await authService.getAdminUser(route.params.userId)
        targetUser.value = userData.user
        populateForm(userData.user)
      } catch (apiError) {
        console.error('API Error:', apiError)
        // Handle different error types
        if (apiError.response?.status === 404) {
          throw new Error('User not found')
        } else if (apiError.response?.status === 403) {
          throw new Error('Access denied')
        } else {
          throw new Error('Failed to fetch user data. Please try again.')
        }
      }
    } else {
      // User editing their own profile
      targetUser.value = currentUser.value
      populateForm(currentUser.value)
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    error.value = err.message || 'Failed to load profile data'
    
    // Redirect if authentication failed
    if (err.message.includes('Authentication') || err.message.includes('Admin access')) {
      router.push(currentUser.value?.role ? '/admin/dashboard' : '/dashboard')
    }
  } finally {
    loading.value = false
  }
}

const populateForm = (user) => {
  // Populate email from user data
  form.email = user.email || ''
  
  // Populate profile fields if they exist
  if (user.profile || user.first_name) {
    const profile = user.profile || user
    form.first_name = profile.first_name || ''
    form.middle_name = profile.middle_name || ''
    form.last_name = profile.last_name || ''
    form.suffix = profile.suffix || ''
    form.sex = profile.sex || ''
    form.date_of_birth = profile.date_of_birth || ''
    form.country = profile.country || ''
    form.province = profile.province || ''
    form.city = profile.city || ''
    form.barangay = profile.barangay || ''
    form.sitio_purok_subdivision = profile.sitio_purok_subdivision || ''
    form.house_street = profile.house_street || ''
    form.phone = profile.phone || ''
  }
}

const validate = () => {
  // Clear previous errors
  Object.keys(errors).forEach(key => errors[key] = '')
  let valid = true

  // Phone validation (required for all users)
  if (!form.phone) {
    errors.phone = 'Phone number is required'
    valid = false
  } else if (!/^[0-9]{11}$/.test(form.phone)) {
    errors.phone = 'Phone number must be 11 digits'
    valid = false
  }

  // Additional validation for admin users editing profiles
  if (isAdminView.value) {
    const requiredFields = ['first_name', 'last_name', 'sex', 'date_of_birth', 'country', 'province', 'city', 'barangay']
    
    requiredFields.forEach(field => {
      if (!form[field]) {
        errors[field] = 'This field is required'
        valid = false
      }
    })
  }

  return valid
}

const handleSubmit = async () => {
  submitError.value = ''
  
  if (!validate()) {
    return
  }

  submitting.value = true

  try {
    let updateData = {}
    
    if (isAdminView.value) {
      // Admin can update all fields
      updateData = {
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        suffix: form.suffix || null,
        sex: form.sex,
        date_of_birth: form.date_of_birth,
        country: form.country,
        province: form.province,
        city: form.city,
        barangay: form.barangay,
        sitio_purok_subdivision: form.sitio_purok_subdivision || null,
        house_street: form.house_street || null,
        phone: form.phone
      }
      
      // Use admin endpoint to update target user's profile
      await authService.updateAdminUserProfile(targetUserId.value, updateData)
    } else {
      // Regular user can only update phone
      updateData = { phone: form.phone }
      
      // Use regular profile endpoint
      await authService.updateProfile(updateData)
    }

    // Show success and redirect
    let redirectPath
    if (isAdminView.value && route.params.userId) {
      // Admin editing another user's profile
      redirectPath = `/admin/users/${targetUserId.value}`
    } else if (isAdminView.value && !route.params.userId) {
      // Admin editing their own profile via admin route
      redirectPath = '/admin/profile'
    } else {
      // Regular user editing their own profile
      redirectPath = '/profile'
    }
    
    router.push(redirectPath)
  } catch (err) {
    console.error('Profile update error:', err)
    submitError.value = err.message || 'Failed to update profile'
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  let redirectPath
  if (isAdminView.value && route.params.userId) {
    // Admin editing another user's profile
    redirectPath = `/admin/users/${targetUserId.value}`
  } else if (isAdminView.value && !route.params.userId) {
    // Admin editing their own profile via admin route
    redirectPath = '/admin/profile'
  } else {
    // Regular user editing their own profile
    redirectPath = '/profile'
  }
  
  router.push(redirectPath)
}
</script>

<style scoped>
.edit-profile {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.header p {
  color: #666;
  margin: 0;
}

.loading-state {
  text-align: center;
  color: #666;
  padding: 40px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
}

.grid {
  display: grid;
  gap: 20px;
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.input-base {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-base:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.input-base:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
}

.user-notice {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  padding: 15px;
  margin: 20px 0;
}

.user-notice p {
  margin: 0;
  color: #1565c0;
  font-size: 14px;
}

.error-message {
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  text-align: center;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.text-red-500 {
  color: #dc3545;
}
</style> 