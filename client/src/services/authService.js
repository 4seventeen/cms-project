import api from './api.js'

// Authentication service for PostgreSQL backend
export const authService = {
  // Sign up a new user
  async signup(userData) {
    try {
      const response = await api.post('/signup', userData)
      // Store user data if needed for UI
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
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
      // Store user data if needed for UI
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
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
    } catch (error) {
      console.warn('Logout API call failed:', error.message)
    } finally {
      // Always clear user data
      localStorage.removeItem('user')
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/user')
      // Update stored user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
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
      // Update stored user data if profile is returned
      if (response.data.profile) {
        const currentUser = this.getStoredUser()
        if (currentUser) {
          currentUser.profile = response.data.profile
          localStorage.setItem('user', JSON.stringify(currentUser))
        }
      }
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

  // Get stored user data
  getStoredUser() {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing stored user:', error)
      return null
    }
  }
}

export default authService 