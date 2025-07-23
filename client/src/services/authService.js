import api from './api.js'

// Authentication service for cookie-based JWT authentication
export const authService = {
  // Sign up a new user
  async signup(userData) {
    try {
      const response = await api.post('/signup', userData)
      return response.data
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  // Sign in user
  async signin(credentials) {
    try {
      const response = await api.post('/signin', credentials)
      return response.data
    } catch (error) {
      console.error('Signin error:', error)
      throw error
    }
  },

  // Sign out user
  async signout() {
    try {
      await api.post('/logout')
      return { success: true, message: 'Signed out successfully' }
    } catch (error) {
      console.warn('Logout API call failed:', error.message)
      // Even if the API call fails, we consider logout successful from client perspective
      return { success: true, message: 'Signed out successfully' }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/user')
      return response.data
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/profile', profileData)
      return response.data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.post('/change-password', passwordData)
      return response.data
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/forgot-password', { email })
      return response.data
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  },

  // Reset password
  async resetPassword(resetData) {
    try {
      const response = await api.post('/reset-password', resetData)
      return response.data
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  // Check if user is authenticated by making a request to a protected endpoint
  async isAuthenticated() {
    try {
      await this.getCurrentUser()
      return true
    } catch (error) {
      return false
    }
  },

  // Refresh access token (handled automatically by API interceptor)
  async refreshToken() {
    try {
      const response = await api.post('/refresh-token')
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  },

  // Verify email with token
  async verifyEmail(token) {
    try {
      const response = await api.post('/verify-email', { token })
      return response.data
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  },

  // Resend email verification
  async resendEmailVerification(email) {
    try {
      const response = await api.post('/resend-verification', { email })
      return response.data
    } catch (error) {
      console.error('Resend verification error:', error)
      throw error
    }
  },

  // Check if current user is admin
  async isAdmin() {
    try {
      const userData = await this.getCurrentUser()
      return userData.user?.role === true
    } catch (error) {
      console.error('Admin check error:', error)
      return false
    }
  },

  // Admin: Get all cases
  async getAdminCases() {
    try {
      const response = await api.get('/admin/cases')
      return response.data
    } catch (error) {
      console.error('Get admin cases error:', error)
      throw error
    }
  },

  // Admin: Get specific case by ID
  async getAdminCase(caseId) {
    try {
      const response = await api.get(`/admin/cases/${caseId}`)
      return response.data
    } catch (error) {
      console.error('Get admin case error:', error)
      throw error
    }
  },

  // Admin: Update a case
  async updateAdminCase(caseId, payload) {
    try {
      const response = await api.put(`/admin/cases/${caseId}`, payload)
      return response.data
    } catch (error) {
      console.error('Update admin case error:', error)
      throw error
    }
  },

  // Admin: Update case category
  async updateCaseCategory(caseId, caseType) {
    try {
      const response = await api.patch(`/admin/cases/${caseId}/category`, { case_type: caseType })
      return response.data
    } catch (error) {
      console.error('Update case category error:', error)
      throw error
    }
  },

  // Admin: Delete a case
  async deleteCase(caseId) {
    try {
      const response = await api.delete(`/admin/cases/${caseId}`)
      return response.data
    } catch (error) {
      console.error('Delete case error:', error)
      throw error
    }
  },

  // Admin: Get all users
  async getAdminUsers() {
    try {
      const response = await api.get('/admin/users')
      return response.data
    } catch (error) {
      console.error('Get admin users error:', error)
      throw error
    }
  },

  // Admin: Get specific user by ID
  async getAdminUser(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`)
      return response.data
    } catch (error) {
      console.error('Get admin user error:', error)
      throw error
    }
  },

  // Admin: Get user's cases
  async getAdminUserCases(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}/cases`)
      return response.data
    } catch (error) {
      console.error('Get admin user cases error:', error)
      throw error
    }
  },

  // Admin: Update user's profile
  async updateAdminUserProfile(userId, profileData) {
    try {
      const response = await api.put(`/admin/users/${userId}/profile`, profileData)
      return response.data
    } catch (error) {
      console.error('Update admin user profile error:', error)
      throw error
    }
  }
}

export default authService 