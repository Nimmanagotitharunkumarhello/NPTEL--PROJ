// Check if the given string is a valid email address
export function isEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  
  // Check if the given string is not empty
  export function isNotEmpty(value) {
    return value.trim().length > 0;
  }
