<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="nav-brand">Case Management System</router-link>
      <div class="nav-links">
        <!-- Unauthenticated links -->
        <template v-if="!props.isLoggedIn">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/about" class="nav-link">About</router-link>
          <div class="nav-complaint">
            <router-link to="/signin" class="complaint-btn">File a Complaint</router-link>
          </div>
        </template>
        <!-- Authenticated links -->
        <template v-else>
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/file-complaint" class="nav-link">File Complaint</router-link>
          <router-link to="/calendar" class="nav-link">Calendar</router-link>
          <router-link to="/profile" class="nav-link">Profile</router-link>
          <button @click="handleSignOut" class="nav-link signout-btn">Sign Out</button>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const showUserMenu = ref(false)

const emit = defineEmits(['sign-out'])

const handleSignOut = () => {
  emit('sign-out')
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

// Debug logging
console.log('Navbar isLoggedIn:', props.isLoggedIn)
</script>

<style scoped>
.navbar {
  background: #333;
  padding: 1rem 0;
  width: 100%;
  height: 100%;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 5px 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
}

.nav-link:hover {
  background: #555;
  border-radius: 4px;
}

.signout-btn {
  color: #ff6b6b;
}

.signout-btn:hover {
  background: #ff6b6b;
  color: white;
}

.profile-dropdown {
  position: relative;
  display: inline-block;
}

.profile-btn {
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px 10px;
}

.profile-btn:hover {
  background: #555;
  border-radius: 4px;
}

.dropdown-menu {
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0;
  background: #222;
  min-width: 140px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 100;
  border-radius: 4px;
  margin-top: 8px;
}

.dropdown-item {
  color: white;
  padding: 10px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 15px;
}

.dropdown-item:hover {
  background: #444;
}

.nav-complaint {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 8px;
}

.complaint-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 15px;
  cursor: pointer;
  margin-bottom: 2px;
  text-decoration: none;
}

.complaint-btn:hover {
  background: #ff4b4b;
}

.signup-redirect {
  font-size: 13px;
  color: #ccc;
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