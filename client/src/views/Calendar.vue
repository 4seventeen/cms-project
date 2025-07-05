<template>
  <div class="calendar-page max-w-5xl mx-auto py-8">
    <!-- Header with month navigation -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <button @click="goPrev" class="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">
          ←
        </button>
        <h2 class="text-xl font-semibold">
          {{ formatMonthYear(focusedDate) }}
        </h2>
        <button @click="goNext" class="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">
          →
        </button>
      </div>
      <Button variant="success" @click="showAddEvent = true" disabled>Add Event</Button>
    </div>

    <!-- Calendar placeholder -->
    <div class="bg-white rounded-lg shadow-lg p-8 text-center">
      <h3 class="text-xl font-semibold mb-4">Calendar Feature</h3>
      <p class="text-gray-600 mb-4">
        The calendar functionality is currently being developed for the PostgreSQL version.
      </p>
      <p class="text-sm text-gray-500">
        This feature will be available in a future update and will include event management and scheduling capabilities.
      </p>
    </div>

    <!-- Current month display (simple grid) -->
    <div class="mt-6 bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-7 gap-1 text-sm">
        <div class="p-2 font-semibold text-center bg-gray-100">Sun</div>
        <div class="p-2 font-semibold text-center bg-gray-100">Mon</div>
        <div class="p-2 font-semibold text-center bg-gray-100">Tue</div>
        <div class="p-2 font-semibold text-center bg-gray-100">Wed</div>
        <div class="p-2 font-semibold text-center bg-gray-100">Thu</div>
        <div class="p-2 font-semibold text-center bg-gray-100">Fri</div>
        <div class="p-2 font-semibold text-center bg-gray-100">Sat</div>
        
        <!-- Calendar days -->
        <div 
          v-for="day in calendarDays" 
          :key="`${day.date}`"
          class="p-2 text-center border border-gray-200 min-h-[40px] flex items-center justify-center"
          :class="{ 
            'bg-gray-50 text-gray-400': !day.isCurrentMonth,
            'bg-blue-100 font-semibold': day.isToday
          }"
        >
          {{ day.day }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import Button from '../components/common/Button.vue'

// Reactive state
const focusedDate = ref(new Date())
const showAddEvent = ref(false)

// Computed calendar days
const calendarDays = computed(() => {
  const monthStart = startOfMonth(focusedDate.value)
  const monthEnd = endOfMonth(focusedDate.value)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => ({
    date: date.toISOString(),
    day: format(date, 'd'),
    isCurrentMonth: isSameMonth(date, focusedDate.value),
    isToday: isSameDay(date, new Date())
  }))
})

function formatMonthYear(date) {
  return format(date, 'MMMM yyyy')
}

function goPrev() {
  focusedDate.value = new Date(focusedDate.value.getFullYear(), focusedDate.value.getMonth() - 1, 1)
}

function goNext() {
  focusedDate.value = new Date(focusedDate.value.getFullYear(), focusedDate.value.getMonth() + 1, 1)
}
</script>

<style scoped>
.calendar-page {
  /* extra padding already via utility classes */
}
</style> 