<template>
  <div class="home">
    <h1>Welcome to Vue CMS</h1>
    <p>This is a simple content management system built with Vue.js and PostgreSQL.</p>
    
    <Card title="Features">
      <ul class="features-list">
        <li>User Authentication</li>
        <li>Modern UI</li>
        <li>Responsive Design</li>
        <li>Real-time Database</li>
      </ul>
    </Card>
    
    <div class="actions">
      <Button variant="success" @click="$router.push('/signup')">Sign Up</Button>
      <Button variant="primary" @click="$router.push('/signin')">Sign In</Button>
    </div>
  </div>
</template>

<script setup>
import Card from '../components/common/Card.vue'
import Button from '../components/common/Button.vue'
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 30px;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  padding: 10px;
  margin: 5px 0;
  background: #f8f9fa;
  border-radius: 5px;
  color: #333;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  margin: 0 10px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}

.btn:hover {
  background: #0056b3;
}
</style> 