<template>
  <div class="verify-email-container">
    <div class="verify-email-card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Verifying your email...</p>
      </div>

      <div v-else-if="success" class="success">
        <div class="success-icon">✓</div>
        <h2>Email Verified Successfully!</h2>
        <p>{{ message }}</p>
        <router-link to="/signin" class="btn btn-primary">
          Sign In
        </router-link>
      </div>

      <div v-else-if="error" class="error">
        <div class="error-icon">✗</div>
        <h2>Verification Failed</h2>
        <p>{{ error }}</p>
        <div class="actions">
          <button @click="resendVerification" class="btn btn-secondary" :disabled="resending">
            {{ resending ? 'Sending...' : 'Resend Verification Email' }}
          </button>
          <router-link to="/signin" class="btn btn-primary">
            Back to Sign In
          </router-link>
        </div>
      </div>

      <div v-else class="default">
        <h2>Email Verification</h2>
        <p>Please wait while we verify your email address...</p>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService'

export default {
  name: 'VerifyEmail',
  data() {
    return {
      loading: true,
      success: false,
      error: null,
      message: '',
      resending: false
    }
  },
  async mounted() {
    await this.verifyEmail()
  },
  methods: {
    async verifyEmail() {
      try {
        const token = this.$route.query.token
        
        if (!token) {
          this.error = 'No verification token provided'
          this.loading = false
          return
        }

        const response = await authService.verifyEmail(token)
        this.success = true
        this.message = response.message
        this.loading = false
      } catch (error) {
        console.error('Email verification error:', error)
        this.error = error.message || 'Email verification failed'
        this.loading = false
      }
    },
    async resendVerification() {
      try {
        this.resending = true
        const email = this.$route.query.email || ''
        
        if (!email) {
          this.error = 'Email address not found. Please try signing up again.'
          return
        }

        await authService.resendEmailVerification(email)
        this.error = 'Verification email has been resent. Please check your inbox.'
      } catch (error) {
        console.error('Resend verification error:', error)
        this.error = error.message || 'Failed to resend verification email'
      } finally {
        this.resending = false
      }
    }
  }
}
</script>

<style scoped>
.verify-email-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.verify-email-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.error-icon {
  width: 60px;
  height: 60px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

h2 {
  margin: 0 0 10px 0;
  color: #333;
}

p {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.default {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style> 