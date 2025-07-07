import api from './api.js'

// Get all cases for the authenticated user
export const getAllCases = async () => {
  try {
    const response = await api.get('/cases')
    return response.data
  } catch (error) {
    console.error('Error fetching cases:', error)
    throw error
  }
}

// Get a specific case by ID
export const getCaseById = async (id) => {
  try {
    const response = await api.get(`/cases/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching case:', error)
    throw error
  }
}

// Create a new case
export const createCase = async (payload) => {
  try { 
    const response = await api.post('/cases', payload)
    return response.data
  } catch (error) {
    console.error('Error creating case:', error)
    throw error
  }
}

// Update case description
export const updateCase = async (id, payload) => {
  try {
    const response = await api.put(`/cases/${id}`, payload)
    return response.data
  } catch (error) {
    console.error('Error updating case:', error)
    throw error
  }
} 