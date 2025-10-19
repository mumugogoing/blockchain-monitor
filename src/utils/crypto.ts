// 简单的加密工具 - 用于在前端环境中存储敏感数据
// 注意：这只是基础的混淆保护，不能替代服务器端安全措施

/**
 * 使用 Web Crypto API 生成密钥
 */
const getEncryptionKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('blockchain-monitor-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * 加密文本
 */
export const encryptData = async (data: string, userPassword: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const key = await getEncryptionKey(userPassword);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoder.encode(data)
    );

    // 将 IV 和加密数据合并并转为 base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('加密失败');
  }
};

/**
 * 解密文本
 */
export const decryptData = async (encryptedData: string, userPassword: string): Promise<string> => {
  try {
    const key = await getEncryptionKey(userPassword);
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('解密失败');
  }
};

/**
 * 生成用户专属密码（基于用户名）
 * 这不是最安全的方式，但在前端环境中是一个合理的权衡
 */
export const generateUserKey = (username: string): string => {
  // 使用用户名和固定盐值生成密钥
  return `${username}-blockchain-monitor-2024`;
};
