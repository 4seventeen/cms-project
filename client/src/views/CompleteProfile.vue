<template>
  <div class="complete-profile">
    <div class="welcome-message">
      <h1>Welcome to the Case Management System!</h1>
      <p class="required-message">
        ⚠️ <strong>Profile Setup Required</strong><br>
        Please complete your profile information to access the system and file complaints.
      </p>
    </div>
    
    <Card title="Complete Your Profile">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information -->
        <section>
          <h2 class="section-title">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput v-model="form.first_name" label="First Name" required :error="errors.first_name" />
            <FormInput v-model="form.middle_name" label="Middle Name (optional)" :error="errors.middle_name" />
            <FormInput v-model="form.last_name" label="Last Name" required :error="errors.last_name" />
            <FormInput v-model="form.suffix" label="Suffix (optional)" :error="errors.suffix" />
            <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
              <label class="input-label">Sex <span class="text-red-500">*</span></label>
              <select v-model="form.sex" class="input-base">
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <span v-if="errors.sex" class="error-text">{{ errors.sex }}</span>
            </div>
            <div class="col-span-1 md:col-span-2 flex flex-col gap-2">
              <label class="input-label">Date of Birth <span class="text-red-500">*</span></label>
              <input type="date" v-model="form.date_of_birth" class="input-base" />
              <span v-if="errors.date_of_birth" class="error-text">{{ errors.date_of_birth }}</span>
            </div>
          </div>
        </section>

        <!-- Address -->
        <section>
          <h2 class="section-title">Address</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput v-model="form.country" label="Country" required :error="errors.country" />
            <FormInput v-model="form.province" label="Province" required :error="errors.province" />
            <FormInput v-model="form.city" label="City / Municipality" required :error="errors.city" />
            <FormInput v-model="form.barangay" label="Barangay" required :error="errors.barangay" />
            <FormInput v-model="form.sitio_purok_subdivision" label="Sitio / Purok / Subdivision (optional)" :error="errors.sitio_purok_subdivision" />
            <FormInput v-model="form.house_street" label="House # & Street (optional)" :error="errors.house_street" />
          </div>
        </section>

        <!-- Contact Information -->
        <section>
          <h2 class="section-title">Contact Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput v-model="form.email" label="Email" readonly />
            <FormInput v-model="form.phone" label="Phone Number" required :error="errors.phone" placeholder="11-digit number" />
          </div>
        </section>

        <!-- Error Message -->
        <div v-if="submitError" class="error-message">{{ submitError }}</div>

        <!-- Submit Button -->
        <Button type="submit" variant="primary" :loading="loading" loading-text="Saving...">Save Profile</Button>
      </form>
    </Card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService.js'
import Card from '../components/common/Card.vue'
import FormInput from '../components/common/FormInput.vue'
import Button from '../components/common/Button.vue'

const router = useRouter()

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

const errors = reactive({})
const submitError = ref('')
const loading = ref(false)

onMounted(async () => {
  try {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/signin')
      return
    }

    // Check if user already has a completed profile
    const response = await authService.getCurrentUser()
    if (response?.user) {
      // If profile already exists, redirect to dashboard
      if (response.user.profile) {
        router.push('/dashboard')
        return
      }
      
      // No profile - prefill email for profile completion
      form.email = response.user.email
    } else {
      router.push('/signin')
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    authService.clearAuthData()
    router.push('/signin')
  }
})

function validate() {
  // Clear previous errors
  for (const key in errors) errors[key] = ''
  let valid = true

  const requiredFields = ['first_name', 'last_name', 'sex', 'date_of_birth', 'country', 'province', 'city', 'barangay', 'phone']
  requiredFields.forEach(field => {
    if (!form[field]) {
      errors[field] = 'This field is required'
      valid = false
    }
  })

  if (form.phone && !/^[0-9]{11}$/.test(form.phone)) {
    errors.phone = 'Phone number must be 11 digits'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return

  loading.value = true

  try {
    // Prepare profile data payload
    const profileData = {
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

    // Update profile using authService
    await authService.updateProfile(profileData)

    // Flag profile completion locally
    localStorage.setItem('profileCompleted', 'true')

    // Show success message briefly before redirecting
    submitError.value = ''
    
    // Redirect to dashboard after successful profile completion
    setTimeout(() => {
      router.push('/dashboard')
    }, 100)
  } catch (err) {
    console.error('Profile save error:', err)
    submitError.value = err.response?.data?.message || err.message || 'Failed to save profile. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.complete-profile {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.welcome-message {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}
.welcome-message h1 {
  color: #333;
  margin-bottom: 15px;
  font-size: 24px;
}
.required-message {
  color: #856404;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 15px;
  border-radius: 6px;
  margin: 0;
  font-size: 16px;
}
.section-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}
.input-label {
  font-weight: 500;
  color: #555;
}
.input-base {
  border: 1px solid #ccc;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 14px;
}
.error-text {
  color: #e53e3e;
  font-size: 13px;
}
.error-message {
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}
</style> 