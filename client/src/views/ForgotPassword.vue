<template>
  <div class="forgot-password">
    <Card title="Forgot Password">
      <p class="description">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <form @submit.prevent="handleSubmit">
        <FormInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="Enter your email address"
          required
          :disabled="loading"
          :error="error"
        />
        
        <Button
          type="submit"
          variant="primary"
          :loading="loading"
          loading-text="Sending reset link..."
        >
          Send Reset Link
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService.js'
import Card from '../components/common/Card.vue'
import FormInput from '../components/common/FormInput.vue'
import Button from '../components/common/Button.vue'

const router = useRouter()

const form = ref({
  email: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  if (loading.value) return

  // Clear previous messages
  error.value = ''
  success.value = ''

  // Validate form
  if (!form.value.email) {
    error.value = 'Please enter your email address'
    return
  }

  loading.value = true

  try {
    const result = await authService.forgotPassword(form.value.email)
    
    success.value = result.message
    
    // Clear form
    form.value.email = ''
    
    // In development, show the reset URL for testing
    if (result.resetUrl) {
      console.log('Reset URL (for testing):', result.resetUrl)
    }
    
  } catch (err) {
    console.error('Forgot password error:', err)
    
    if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else if (typeof err === 'string') {
      error.value = err
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Failed to send reset link. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password {
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