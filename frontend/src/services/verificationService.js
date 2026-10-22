import api from './api'

export const sendOtp = (channel, destination) =>
  api.post('/verification/send-otp', { channel, destination }).then((r) => r.data)
export const verifyOtp = (channel, destination, code) =>
  api.post('/verification/verify-otp', { channel, destination, code }).then((r) => r.data)
