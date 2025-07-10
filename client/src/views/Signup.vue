<template>
  <div class="signup">
    <Card title="Sign Up">
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

        <FormInput
          v-model="form.confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          required
          :disabled="loading"
          :error="error"
        />

        <Button
          type="submit"
          variant="success"
          :loading="loading"
          loading-text="Creating account..."
        >
          Sign Up
        </Button>
      </form>
    </Card>

    <div class="signin-redirect">
      Already have an account?
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
  email: '',
  password: '',
  confirmPassword: '',
  username: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  if (loading.value) return

  // Clear previous error
  error.value = ''

  // Validate form
  if (!form.value.email || !form.value.password || !form.value.confirmPassword) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  loading.value = true

  try {
    const result = await authService.signup({
      email: form.value.email,
      password: form.value.password,
      username: form.value.username || undefined
    })

    console.log('Sign up successful:', result.user?.email)
    
    // Show success message about email verification
    success.value = result.message || 'Account created successfully! Please check your email to verify your account before signing in.'
    
    // Clear form
    form.value = {
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    }
  } catch (err) {
    console.error('Sign up error:', err)
    
    if (err.response?.status === 409) {
      error.value = 'Email already exists'
    } else if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else {
      error.value = 'Sign up failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signup {
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
</style> 