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
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue')
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../views/VerifyEmail.vue')
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
  },
  // Admin routes
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/manage-users',
    name: 'AdminManageUsers',
    component: () => import('../views/admin/AdminManageUsers.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/users/:id',
    name: 'AdminUserProfile',
    component: () => import('../views/admin/AdminUserProfile.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/calendar',
    name: 'AdminCalendar',
    component: () => import('../views/admin/AdminCalendar.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/profile',
    name: 'AdminProfile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  // Define routes that REQUIRE authentication
  const protectedRoutes = ['/dashboard', '/file-complaint', '/calendar', '/profile', '/complete-profile', '/edit-profile'];
  const caseRoutePattern = /^\/case/; // Matches /case/*, /case/*/edit
  const adminRoutePattern = /^\/admin/; // Matches /admin/*
  
  // Check if current route requires authentication
  const requiresAuth = protectedRoutes.includes(to.path) || 
                      caseRoutePattern.test(to.path) || 
                      adminRoutePattern.test(to.path);
  
  // If route doesn't require auth, allow access
  if (!requiresAuth) {
    return next();
  }

  // Route requires authentication - check if user is authenticated
  try {
    // Check authentication by getting current user
    const userData = await authService.getCurrentUser();
    
    // Check for admin routes
    if (to.meta?.requiresAdmin || adminRoutePattern.test(to.path)) {
      if (!userData.user?.role) {
        console.log('Admin access required but user is not admin, redirecting to dashboard');
        return next('/dashboard');
      }
      // Admin user accessing admin route - allow access
      return next();
    }
    
    // Regular user routes - check for profile completion for certain routes
    const profileRequiredRoutes = ['/dashboard', '/file-complaint', '/calendar'];
    
    const requiresProfile = profileRequiredRoutes.includes(to.path) || 
                           caseRoutePattern.test(to.path);

    if (requiresProfile && !userData.user?.profile) {
      console.log('Profile incomplete, redirecting to complete profile');
      return next('/complete-profile');
    }

    // All checks passed, allow access
    return next();
  } catch (error) {
    console.error('Authentication required but user not authenticated:', error);
    
    // User not authenticated for protected route - redirect to signin
    return next('/signin');
  }
});

export default router 