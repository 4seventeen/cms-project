import api from './api.js'

// Authentication service for PostgreSQL backend
export const authService = {
  // Sign up a new user
  async signup(userData) {
    try {
      const response = await api.post('/signup', userData)
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
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
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
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
      // Always clear local storage
      localStorage.removeItem('token')
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

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    // Check if token and user exist
    if (!token || !user) {
      return false
    }
    
    // Basic token validation - check if it's properly formatted and not expired
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        // Invalid JWT format
        this.clearAuthData()
        return false
      }
      
      // Decode token payload to check expiration
      const payload = JSON.parse(atob(tokenParts[1]))
      const now = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < now) {
        // Token expired
        this.clearAuthData()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Token validation error:', error)
      this.clearAuthData()
      return false
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
  },

  // Get stored token
  getStoredToken() {
    return localStorage.getItem('token')
  },

  // Clear all auth data
  clearAuthData() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default authService 