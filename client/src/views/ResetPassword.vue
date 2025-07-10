<template>
  <div class="reset-password">
    <Card title="Reset Password">
      <p class="description">
        Enter your new password below.
      </p>
      
      <form @submit.prevent="handleSubmit">
        <FormInput
          v-model="form.newPassword"
          label="New Password"
          type="password"
          placeholder="Enter your new password"
          required
          :disabled="loading"
          :error="error"
        />
        
        <FormInput
          v-model="form.confirmPassword"
          label="Confirm New Password"
          type="password"
          placeholder="Confirm your new password"
          required
          :disabled="loading"
          :error="error"
        />
        
        <Button
          type="submit"
          variant="primary"
          :loading="loading"
          loading-text="Resetting password..."
        >
          Reset Password
        </Button>
      </form>
    </Card>
    
    <div class="signin-redirect">
      Remember your password?
      <router-link to="/signin" class="signin-link">Sign In</router-link>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="success" class="success-message">
      {{ success }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authService from '../services/authService.js'
import Card from '../components/common/Card.vue'
import FormInput from '../components/common/FormInput.vue'
import Button from '../components/common/Button.vue'

const router = useRouter()
const route = useRoute()

const form = ref({
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const token = ref('')

onMounted(() => {
  // Get token from URL query parameter
  token.value = route.query.token
  
  if (!token.value) {
    error.value = 'Invalid reset link. Please request a new password reset.'
  }
})

const handleSubmit = async () => {
  if (loading.value) return

  // Clear previous messages
  error.value = ''
  success.value = ''

  // Validate form
  if (!form.value.newPassword || !form.value.confirmPassword) {
    error.value = 'Please fill in all fields'
    return
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (form.value.newPassword.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  if (!token.value) {
    error.value = 'Invalid reset link. Please request a new password reset.'
    return
  }

  loading.value = true

  try {
    const result = await authService.resetPassword({
      token: token.value,
      newPassword: form.value.newPassword,
      confirmPassword: form.value.confirmPassword
    })
    
    success.value = result.message
    
    // Clear form
    form.value.newPassword = ''
    form.value.confirmPassword = ''
    
    // Redirect to signin after a short delay
    setTimeout(() => {
      router.push('/signin')
    }, 2000)
    
  } catch (err) {
    console.error('Reset password error:', err)
    
    if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else if (typeof err === 'string') {
      error.value = err
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Failed to reset password. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.description {
  color: #666;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.5;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

.signin-redirect {
  font-size: 14px;
  color: #555;
  text-align: center;
  margin-top: 18px;
}

.signin-link {
  color: #007bff;
  text-decoration: none;
}

.signin-link:hover {
  text-decoration: underline;
}
</style> 