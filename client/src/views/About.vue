<template>
  <div class="about">
    <h1>About Vue CMS</h1>
    <p>This is a simple content management system built with modern web technologies.</p>
    
    <div class="tech-stack">
      <h2>Technology Stack:</h2>
      <ul>
        <li>Vue.js 3 - Frontend Framework</li>
        <li>Vite - Build Tool</li>
        <li>PostgreSQL - Database</li>
        <li>Vue Router - Navigation</li>
      </ul>
    </div>
    
    <div class="features">
      <h2>Features:</h2>
      <ul>
        <li>User Authentication</li>
        <li>Secure API</li>
        <li>Responsive Design</li>
        <li>Real-time Database</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// About component logic
</script>

<style scoped>
.about {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.tech-stack, .features {
  margin: 30px 0;
}

h2 {
  color: #333;
  margin-bottom: 15px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 10px;
  margin: 5px 0;
  background: #f8f9fa;
  border-radius: 5px;
  color: #333;
}
</style> 