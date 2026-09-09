(() => {
  'use strict';

  const SESSION_KEY = 'otthos_game_account_session_v1';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function normalizeUsername(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .replace(/\.+/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, 20);
  }

  function validateCredentials(username, password) {
    const clean = normalizeUsername(username);
    if (clean.length < 3) throw new Error('O usuário precisa ter de 3 a 20 letras ou números.');
    if (String(password || '').length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    if (String(password || '').length > 64) throw new Error('A senha pode ter no máximo 64 caracteres.');
    if (String(password || '').toLowerCase() === clean) throw new Error('A senha deve ser diferente do usuário.');
    return clean;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(String(value || ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function bytesToHex(bytes) {
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function deriveCredentials(username, password) {
    if (!crypto?.subtle) throw new Error('Este navegador não oferece a proteção necessária para a conta.');
    const clean = validateCredentials(username, password);
    const accountDigest = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(`otthos-account-v1\u0000${clean}\u0000${password}`)
    );
    const saltDigest = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(`otthos-save-salt-v1\u0000${clean}`)
    );
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(String(password)),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltDigest, iterations: 160000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    return {
      schema: 1,
      accountId: bytesToHex(new Uint8Array(accountDigest)),
      username: clean,
      key: bytesToBase64(rawKey)
    };
  }

  async function importSessionKey(session) {
    if (!session?.key || !session?.accountId) throw new Error('Sessão de conta inválida.');
    return crypto.subtle.importKey(
      'raw',
      base64ToBytes(session.key),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptState(state, session) {
    const key = await importSessionKey(session);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = encoder.encode(JSON.stringify(state));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: encoder.encode(`OTTHOS:${session.accountId}`) },
      key,
      plaintext
    );
    return {
      schema: 1,
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      updatedAtClient: Date.now()
    };
  }

  async function decryptState(record, session) {
    if (!record?.iv || !record?.ciphertext) throw new Error('O progresso desta conta está incompleto.');
    try {
      const key = await importSessionKey(session);
      const plaintext = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: base64ToBytes(record.iv),
          additionalData: encoder.encode(`OTTHOS:${session.accountId}`)
        },
        key,
        base64ToBytes(record.ciphertext)
      );
      const parsed = JSON.parse(decoder.decode(plaintext));
      if (!parsed || typeof parsed !== 'object' || !parsed.profile) throw new Error('Formato inválido.');
      return parsed;
    } catch {
      throw new Error('Não foi possível abrir o progresso. Confira usuário e senha.');
    }
  }

  function rememberSession(session) {
    const safe = {
      schema: 1,
      accountId: String(session?.accountId || ''),
      username: normalizeUsername(session?.username),
      key: String(session?.key || '')
    };
    if (!/^[a-f0-9]{64}$/.test(safe.accountId) || !safe.key || safe.username.length < 3) {
      throw new Error('Não foi possível guardar a sessão desta conta.');
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
    return safe;
  }

  function getSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!value || !/^[a-f0-9]{64}$/.test(String(value.accountId || '')) || !value.key) return null;
      return value;
    } catch {
      return null;
    }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }

  window.OTTHOS_ACCOUNT = {
    version: 1,
    normalizeUsername,
    validateCredentials,
    deriveCredentials,
    encryptState,
    decryptState,
    rememberSession,
    getSession,
    clearSession
  };
})();
