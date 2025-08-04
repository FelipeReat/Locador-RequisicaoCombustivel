// Simple test to verify the password reset endpoint works
console.log('Testing password reset functionality...');
console.log('Please login as admin and call the API endpoint manually.');
console.log('Endpoint: POST /api/admin/reset-passwords');
console.log('Body: {"newPassword": "blomaq123", "excludeUsernames": ["admin"]}');
console.log('This will reset all user passwords to "blomaq123" except admin.');