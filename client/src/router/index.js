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
  const publicPages = ['Home', 'About', 'Signup', 'Signin'];
  const protectedRoutes = ['/dashboard', '/file-complaint', '/calendar', '/case'];
  const profileRoutes = ['/profile', '/complete-profile'];

  // Allow access to public pages by route name
  if (to.matched.some(record => publicPages.includes(record.name))) {
    return next();
  }

  // For protected and profile routes, check authentication with backend
  if (protectedRoutes.some(route => to.path.startsWith(route)) || profileRoutes.includes(to.path)) {
    try {
      const userData = await authService.getCurrentUser();
      // For protected routes, check profile completion
      if (protectedRoutes.some(route => to.path.startsWith(route))) {
        if (!userData.user?.profile) {
          return next('/complete-profile');
        }
      }
      // Authenticated, allow access
      return next();
    } catch (error) {
      console.error('Authentication validation failed:', error);
      return next('/signin');
    }
  }

  // Allow access to other routes
  next();
});

export default router 