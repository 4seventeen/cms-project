<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authService from './services/authService.js'
import Navbar from './components/common/Navbar.vue'

const router = useRouter()
const route = useRoute()
const isLoggedIn = ref(false)

const checkAuthStatus = async () => {
  try {
    await authService.getCurrentUser()
    isLoggedIn.value = true
  } catch {
    isLoggedIn.value = false
  }
}

const handleSignOut = async () => {
  try {
    await authService.signout()
    isLoggedIn.value = false
    router.push('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    // Clear local data even if API call fails
    authService.clearAuthData()
    isLoggedIn.value = false
    router.push('/signin')
  }
}

onMounted(() => {
  checkAuthStatus()
})

// Watch for route changes to update auth status
watch(route, () => {
  checkAuthStatus()
})
</script>

<template>
  <div id="app">
    <Navbar :isLoggedIn="isLoggedIn" @sign-out="handleSignOut" />
    
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
