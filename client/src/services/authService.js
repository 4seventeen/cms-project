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
  }
}

export default authService 