// --- More Robust Helper Functions ---
// These functions avoid the intermediate string representation that can cause errors with btoa/atob on certain byte values.
const uint8ArrayToBase64 = (a: Uint8Array): string => {
    return btoa(String.fromCharCode.apply(null, Array.from(a)));
};

const base64ToUint8Array = (b64: string): Uint8Array => {
    const byteString = atob(b64);
    const a = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        a[i] = byteString.charCodeAt(i);
    }
    return a;
};


// --- Core Crypto Functions ---

const getPasswordKey = (password: string): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
};

export const generateSalt = (): string => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return uint8ArrayToBase64(salt);
};

export const getEncryptionKey = async (password: string, salt: string): Promise<CryptoKey> => {
  const passwordKey = await getPasswordKey(password);
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToUint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encrypt = async (data: string, key: CryptoKey): Promise<string> => {
  const encodedData = new TextEncoder().encode(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );
  
  // Combine IV and ciphertext for storage: iv_base64:ciphertext_base64
  return `${uint8ArrayToBase64(iv)}:${uint8ArrayToBase64(new Uint8Array(encryptedData))}`;
};

export const decrypt = async (encryptedString: string, key: CryptoKey): Promise<string> => {
  const [ivB64, encryptedDataB64] = encryptedString.split(':');
  if (!ivB64 || !encryptedDataB64) {
      throw new Error("Invalid encrypted string format.");
  }
  
  const iv = base64ToUint8Array(ivB64);
  const encryptedData = base64ToUint8Array(encryptedDataB64);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decrypted);
};