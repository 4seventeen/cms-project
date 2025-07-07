<template>
  <div class="signin">
    <Card title="Sign In">
      <form @submit.prevent="handleSubmit">
        <FormInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          required
          :disabled="loading"
          :error="error"
        />
        
        <FormInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          required
          :disabled="loading"
          :error="error"
        />
        
        <Button
          type="submit"
          variant="primary"
          :loading="loading"
          loading-text="Signing in..."
        >
          Sign In
        </Button>
      </form>
    </Card>
    
    <div class="signup-redirect">
      Don't have an account?
      <router-link to="/signup" class="signup-link">Sign Up</router-link>
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
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  if (loading.value) return

  // Clear previous error
  error.value = ''

  // Validate form
  if (!form.value.email || !form.value.password) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true

  try {
    const result = await authService.signin({
      email: form.value.email,
      password: form.value.password
    })

    console.log('Sign in successful:', result.user?.email)
    
    // Update navbar auth status
    if (window.updateNavAuthStatus) {
      window.updateNavAuthStatus(true)
    }
    
    // Check if user has completed their profile using the result from signin
    if (!result.user?.profile) {
      // No profile - redirect to complete profile
      router.push('/complete-profile')
    } else {
      // Profile exists - redirect to dashboard
      router.push('/dashboard')
    }
  } catch (err) {
    console.error('Sign in error:', err)
    // Always prefer backend error message if present
    if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else if (err.response?.status === 401) {
      error.value = 'Invalid email or password'
    } else if (typeof err === 'string') {
      error.value = err
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Sign in failed. Please try again.'
    }
    // Debug: log the error value
    console.log('Displayed error:', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signin {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
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

.signup-redirect {
  font-size: 14px;
  color: #555;
  text-align: center;
  margin-top: 18px;
}

.signup-link {
  color: #ff6b6b;
  margin-left: 4px;
  text-decoration: underline;
  cursor: pointer;
}

.signup-link:hover {
  color: #ff4b4b;
}
</style>