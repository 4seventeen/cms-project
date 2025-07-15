<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from './services/authService.js'
import Navbar from './components/common/Navbar.vue'

const router = useRouter()
const isLoggedIn = ref(false)
const isAdmin = ref(false)

const checkAuthStatus = async () => {
  try {
    // Check authentication status by making a request to get current user
    const userData = await authService.getCurrentUser()
    isLoggedIn.value = true
    isAdmin.value = userData.user?.role === true
  } catch (error) {
    // Don't log 401 errors as they're expected for unauthenticated users
    if (error.response?.status !== 401) {
      console.error('Auth check error:', error)
    }
    isLoggedIn.value = false
    isAdmin.value = false
  }
}

const handleSignOut = async () => {
  try {
    await authService.signout()
    isLoggedIn.value = false
    isAdmin.value = false
    router.push('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    // Even if API call fails, consider sign out successful
    isLoggedIn.value = false
    isAdmin.value = false
    router.push('/signin')
  }
}

// Only check auth status on initial mount, not on every route change
onMounted(() => {
  checkAuthStatus()
})

// Expose a method to manually update auth status when needed
const updateAuthStatus = (status, adminStatus = false) => {
  isLoggedIn.value = status
  isAdmin.value = adminStatus
}

// Make updateAuthStatus available globally for signin/signup components
window.updateNavAuthStatus = updateAuthStatus
</script>

<template>
  <div id="app">
    <Navbar 
      :isLoggedIn="isLoggedIn" 
      :isAdmin="isAdmin"
      @sign-out="handleSignOut" 
    />
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
