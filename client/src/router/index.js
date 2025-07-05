import { createRouter, createWebHistory } from 'vue-router'
import authService from '../services/authService.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../views/Signup.vue')
  },
  {
    path: '/signin',
    name: 'Signin',
    component: () => import('../views/Signin.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/file-complaint',
    name: 'FileComplaint',
    component: () => import('../views/FileComplaint.vue')
  },
  {
    path: '/case/:id',
    name: 'CaseDetail',
    component: () => import('../views/CaseDetail.vue')
  },
  {
    path: '/case/:id/edit',
    name: 'EditCase',
    component: () => import('../views/EditCase.vue')
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../views/Calendar.vue')
  },
  {
    path: '/complete-profile',
    name: 'CompleteProfile',
    component: () => import('../views/CompleteProfile.vue')
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: () => import('../views/CompleteProfile.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const publicPages = ['/', '/about', '/signup', '/signin'];
  const protectedRoutes = ['/dashboard', '/file-complaint', '/calendar', '/case'];
  const profileRoutes = ['/profile', '/complete-profile'];

  // Allow access to public pages
  if (publicPages.includes(to.path)) {
    return next();
  }

  // Check if user is authenticated by validating token with backend
  if (!authService.isAuthenticated()) {
    // No token or user data in localStorage
    if (protectedRoutes.some(route => to.path.startsWith(route)) || profileRoutes.includes(to.path)) {
      return next('/signin');
    }
    return next();
  }

  // User has token - validate it with backend for protected routes
  if (protectedRoutes.some(route => to.path.startsWith(route))) {
    try {
      // Validate token and check profile completion
      const userData = await authService.getCurrentUser();
      
      // If no profile exists, redirect to complete profile
      if (!userData.user?.profile) {
        return next('/complete-profile');
      }
      
      // Profile exists, allow access
      return next();
    } catch (error) {
      console.error('Authentication validation failed:', error);
      // Clear invalid auth data and redirect to signin
      authService.clearAuthData();
      return next('/signin');
    }
  }

  // For profile-related routes, validate authentication
  if (profileRoutes.includes(to.path)) {
    try {
      // Validate token with backend
      await authService.getCurrentUser();
      return next();
    } catch (error) {
      console.error('Authentication validation failed:', error);
      // Clear invalid auth data and redirect to signin
      authService.clearAuthData();
      return next('/signin');
    }
  }

  // Allow access to other routes
  next();
});

export default router 