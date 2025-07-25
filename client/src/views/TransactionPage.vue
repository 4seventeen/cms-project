<template>
  <div class="transaction-page">
    <div class="header">
      <h1>Select Payment Method</h1>
      <p>Choose how you'd like to pay for your complaint filing fee</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p v-if="currentStep === 'selection'">Verifying case access...</p>
      <p v-else>Processing payment...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      {{ error }}
      <Button @click="resetState" variant="secondary" class="mt-4">Try Again</Button>
    </div>

    <!-- Payment Method Selection -->
    <div v-else-if="currentStep === 'selection'" class="payment-selection">
      <div class="payment-methods">
        <div class="payment-method-card" @click="selectPaymentMethod('counter')">
          <div class="method-icon">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h3>Pay at the Counter</h3>
          <p>Get a reference number and pay at the Barangay Hall counter</p>
          <div class="method-badge">Traditional</div>
        </div>

        <div class="payment-method-card" @click="selectPaymentMethod('gcash')">
          <div class="method-icon">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3>GCash</h3>
          <p>Pay instantly using GCash and upload your receipt</p>
          <div class="method-badge gcash">Digital</div>
        </div>
      </div>

      <div class="back-action">
        <Button @click="goBackToDashboard" variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>

    <!-- Counter Payment Flow -->
    <div v-else-if="currentStep === 'counter'" class="counter-payment">
      <Card title="Payment Reference Generated">
        <div class="reference-display">
          <div class="reference-code">
            <h2>{{ referenceCode }}</h2>
            <p class="reference-label">Reference Number</p>
          </div>
          <div class="instruction">
            <h3>Instructions:</h3>
            <ol>
              <li>Take note of your reference number above</li>
              <li>Visit the Barangay Hall during office hours</li>
              <li>Present this reference number at the counter</li>
              <li>Pay the required fee</li>
              <li>Keep your receipt for future reference</li>
            </ol>
          </div>
        </div>
        
                 <div class="actions">
           <Button @click="goBackToSelection" variant="secondary">
             Back to Payment Methods
           </Button>
           <Button @click="goBackToDashboard" variant="primary">
             Back to Dashboard
           </Button>
           <Button @click="cancelComplaint" variant="danger" :loading="cancelling">
             Cancel Complaint
           </Button>
         </div>
      </Card>
    </div>

    <!-- GCash Payment Flow -->
    <div v-else-if="currentStep === 'gcash'" class="gcash-payment">
      <Card title="GCash Payment">
        <div class="gcash-flow">
          <!-- QR Code -->
          <div class="qr-section">
            <h3>Scan QR Code to Pay</h3>
            <div class="qr-container">
              <img src="/src/assets/gcash-qr.jpg" alt="GCash QR Code" class="qr-code" />
            </div>
            <p class="amount-info">Amount: ₱100.00</p>
          </div>

          <!-- Receipt Upload -->
          <div class="upload-section">
            <h3>Upload Your GCash Receipt</h3>
            <div class="upload-container">
              <input 
                type="file" 
                @change="handleReceiptUpload" 
                accept="image/*"
                ref="fileInput"
                :disabled="uploading"
              />
              <div v-if="selectedReceipt" class="selected-file">
                <p>Selected: {{ selectedReceipt.name }}</p>
                <Button @click="submitGCashPayment" variant="success" :loading="uploading">
                  Upload Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div class="actions">
          <Button @click="goBackToSelection" variant="secondary" :disabled="uploading">
            Back to Payment Methods
          </Button>
          <Button @click="cancelComplaint" variant="danger" :loading="cancelling" :disabled="uploading">
            Cancel Complaint
          </Button>
        </div>
      </Card>
    </div>

    <!-- Success State -->
    <div v-else-if="currentStep === 'success'" class="success-state">
      <Card title="Payment Submitted Successfully">
        <div class="success-content">
          <div class="success-icon">
            <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div v-if="paymentMethod === 'gcash'">
            <h3>Receipt Uploaded Successfully</h3>
            <p>Your payment is pending admin verification. You will be notified once it's approved.</p>
          </div>
          <div v-else>
            <h3>Reference Generated</h3>
            <p>Please visit the Barangay Hall with your reference number to complete payment.</p>
          </div>
        </div>

        <div class="actions">
          <Button @click="goBackToDashboard" variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api.js'
import Card from '../components/common/Card.vue'
import Button from '../components/common/Button.vue'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(false)
const uploading = ref(false)
const cancelling = ref(false)
const error = ref('')
const currentStep = ref('selection')
const paymentMethod = ref('')
const referenceCode = ref('')
const selectedReceipt = ref(null)
const fileInput = ref(null)

// Get case ID from route params
const caseId = route.params.caseId

// Validate case ID on mount
onMounted(() => {
  if (!caseId) {
    error.value = 'Invalid case ID'
    return
  }
  
  // Check if user has access to this case
  // Add a small delay to allow for case creation to complete
  setTimeout(() => {
    checkCaseAccess()
  }, 500)
})

const checkCaseAccess = async (retryCount = 0) => {
  try {
    loading.value = true
    // This will throw an error if user doesn't have access
    await api.get(`/payments/status/${caseId}`)
  } catch (err) {
    console.error('Case access check failed:', err)
    
    // If it's a 404 error and we haven't retried yet, wait a bit and try again
    // This handles the timing issue where case might not be immediately available
    if (err.response?.status === 404 && retryCount < 2) {
      console.log(`Retrying case access check (attempt ${retryCount + 1})`)
      setTimeout(() => {
        checkCaseAccess(retryCount + 1)
      }, 1000) // Wait 1 second before retry
      return
    }
    
    error.value = 'You do not have access to this case or the case does not exist'
  } finally {
    loading.value = false
  }
}

const selectPaymentMethod = (method) => {
  paymentMethod.value = method
  
  if (method === 'counter') {
    generateReferenceCode()
  } else if (method === 'gcash') {
    currentStep.value = 'gcash'
  }
}

const generateReferenceCode = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await api.post('/payments/reference', {
      caseId: caseId,
      method: 'counter'
    })

    if (response.data.success) {
      referenceCode.value = response.data.referenceCode
      currentStep.value = 'counter'
    } else {
      throw new Error(response.data.error || 'Failed to generate reference')
    }
  } catch (err) {
    console.error('Generate reference error:', err)
    error.value = err.response?.data?.error || 'Failed to generate payment reference'
  } finally {
    loading.value = false
  }
}

const handleReceiptUpload = (event) => {
  const file = event.target.files[0]
  
  if (!file) {
    selectedReceipt.value = null
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Please select a valid image file (JPEG, PNG, or GIF)'
    event.target.value = ''
    return
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File size must be less than 5MB'
    event.target.value = ''
    return
  }

  selectedReceipt.value = file
  error.value = ''
}

const submitGCashPayment = async () => {
  if (!selectedReceipt.value) {
    error.value = 'Please select a receipt file'
    return
  }

  try {
    uploading.value = true
    error.value = ''

    const formData = new FormData()
    formData.append('caseId', caseId)
    formData.append('method', 'gcash')
    formData.append('receipt', selectedReceipt.value)

    const response = await api.post('/payments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      currentStep.value = 'success'
    } else {
      throw new Error(response.data.error || 'Failed to upload receipt')
    }
  } catch (err) {
    console.error('Upload receipt error:', err)
    error.value = err.response?.data?.error || 'Failed to upload receipt'
  } finally {
    uploading.value = false
  }
}

const cancelComplaint = async () => {
  if (!confirm('Are you sure you want to cancel this complaint? This action cannot be undone.')) {
    return
  }

  try {
    cancelling.value = true
    error.value = ''

    const response = await api.delete(`/payments/cases/${caseId}`)

    if (response.data.success) {
      // Redirect to dashboard
      router.push('/dashboard')
    } else {
      throw new Error(response.data.error || 'Failed to cancel complaint')
    }
  } catch (err) {
    console.error('Cancel complaint error:', err)
    error.value = err.response?.data?.error || 'Failed to cancel complaint'
  } finally {
    cancelling.value = false
  }
}

const goBackToDashboard = () => {
  router.push('/dashboard')
}

const goBackToSelection = () => {
  currentStep.value = 'selection'
  paymentMethod.value = ''
  referenceCode.value = ''
  selectedReceipt.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetState = () => {
  error.value = ''
  currentStep.value = 'selection'
  paymentMethod.value = ''
  referenceCode.value = ''
  selectedReceipt.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<style scoped>
.transaction-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
}

.header p {
  color: #666;
  font-size: 16px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.payment-method-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.payment-method-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.method-icon {
  color: #3b82f6;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.method-icon svg {
  width: 48px;
  height: 48px;
}

.payment-method-card h3 {
  color: #1f2937;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: 600;
}

.payment-method-card p {
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.5;
}

.method-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.method-badge.gcash {
  background: #dcfce7;
  color: #166534;
}

.back-action {
  text-align: center;
}

.reference-display {
  text-align: center;
  margin-bottom: 30px;
}

.reference-code {
  background: #f8fafc;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
}

.reference-code h2 {
  color: #1f2937;
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 4px;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
}

.reference-label {
  color: #6b7280;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.instruction {
  text-align: left;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 20px;
}

.instruction h3 {
  color: #92400e;
  margin-bottom: 15px;
}

.instruction ol {
  color: #78350f;
  padding-left: 20px;
}

.instruction li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.gcash-flow {
  display: grid;
  gap: 30px;
}

.qr-section {
  text-align: center;
}

.qr-container {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  display: inline-block;
  margin: 20px 0;
}

.qr-code {
  width: 500px;
  height: 500px;
  object-fit: contain;
}

.amount-info {
  color: #059669;
  font-size: 18px;
  font-weight: 600;
}

.upload-section {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
}

.upload-container input[type="file"] {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 100%;
  max-width: 400px;
}

.selected-file {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 15px;
  margin-top: 15px;
}

.selected-file p {
  color: #166534;
  margin-bottom: 10px;
  font-weight: 500;
}

.success-state {
  text-align: center;
}

.success-content {
  text-align: center;
  padding: 20px;
}

.success-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.success-content h3 {
  color: #059669;
  margin-bottom: 10px;
  font-size: 20px;
}

.success-content p {
  color: #6b7280;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}

.actions Button {
  min-width: 140px;
}

@media (max-width: 640px) {
  .payment-methods {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .reference-code h2 {
    font-size: 24px;
    letter-spacing: 2px;
  }
}

.w-12 { width: 3rem; }
.h-12 { height: 3rem; }
.w-16 { width: 4rem; }
.h-16 { height: 4rem; }
.text-green-500 { color: #10b981; }
.mt-4 { margin-top: 1rem; }
</style> 