


// Function to verify a plain password against a Base64 encoded password
export async function verifyBase64Password(plainPassword, encodedPassword) {
  try {
    // Decode the stored Base64 password
    const decodedStoredPassword = baseDecode(encodedPassword);
    
    if (!decodedStoredPassword) {
      return false;
    }
    
    // Compare plain password with decoded password
    return plainPassword === decodedStoredPassword;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Helper functions
export function baseEncode(value) {
  if (value) {
    return Buffer.from(value.trim()).toString('base64');
  }
  return null;
}

export function baseDecode(value, wrap = 0) {
  if (!value) return null;

  let decodedValue = Buffer.from(value.trim(), 'base64').toString('utf-8');

  if (wrap !== 0) {
    decodedValue = decodedValue.replace(new RegExp(`(.{${wrap}})`, 'g'), '$1<br />');
  }

  return decodedValue;
}