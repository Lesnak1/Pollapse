import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'lib', 'bot-users.json');

// Initialize empty DB locally if not exists
if (typeof window === 'undefined' && !fs.existsSync(DB_FILE)) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  } catch (e) {
    console.error('Failed to initialize local bot database:', e);
  }
}

// Helper to make Vercel KV Redis REST requests directly (zero NPM package dependency!)
async function kvRequest(command, args = []) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([command, ...args]),
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error('Vercel KV REST response error status:', res.status);
      return null;
    }
    const data = await res.json();
    return data.result;
  } catch (e) {
    console.error('Vercel KV Redis error:', e);
    return null;
  }
}

export async function getAllUsers() {
  const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (isVercelKV) {
    try {
      // Get all chatIds from the Redis set
      const chatIds = await kvRequest('SMEMBERS', ['bot:users']) || [];
      const users = [];
      
      // Fetch each user profile
      for (const chatId of chatIds) {
        if (!chatId) continue;
        const userDataStr = await kvRequest('GET', [`user:${chatId}`]);
        if (userDataStr) {
          try {
            users.push(JSON.parse(userDataStr));
          } catch { /* skip */ }
        }
      }
      return users;
    } catch (e) {
      console.error('Error fetching from Vercel KV:', e);
      return [];
    }
  } else {
    // Local JSON Fallback
    try {
      if (!fs.existsSync(DB_FILE)) return [];
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(data);
      return db.users || [];
    } catch (e) {
      console.error('Error reading local bot DB:', e);
      return [];
    }
  }
}

export async function getUser(chatId) {
  const users = await getAllUsers();
  const idStr = String(chatId);
  return users.find(u => String(u.chatId) === idStr) || null;
}

export async function saveUser(user) {
  const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const idStr = String(user.chatId);

  const userData = {
    chatId: idStr,
    username: user.username || '',
    budget: user.budget !== undefined ? Number(user.budget) : 1500,
    sectors: user.sectors || ['all'],
    risk: user.risk || 'medium',
    active: user.active !== undefined ? !!user.active : true,
    updatedAt: new Date().toISOString(),
    createdAt: user.createdAt || new Date().toISOString()
  };

  if (isVercelKV) {
    try {
      // Add chat ID to set of subscribers
      await kvRequest('SADD', ['bot:users', idStr]);
      
      // Set user data stringified
      await kvRequest('SET', [`user:${idStr}`, JSON.stringify(userData)]);
      
      return userData;
    } catch (e) {
      console.error('Error saving to Vercel KV:', e);
      return null;
    }
  } else {
    // Local JSON Fallback
    try {
      const users = await getAllUsers();
      const existingIndex = users.findIndex(u => String(u.chatId) === idStr);

      if (existingIndex > -1) {
        userData.createdAt = users[existingIndex].createdAt || userData.createdAt;
        users[existingIndex] = { ...users[existingIndex], ...userData };
      } else {
        users.push(userData);
      }

      fs.writeFileSync(DB_FILE, JSON.stringify({ users }, null, 2));
      return userData;
    } catch (e) {
      console.error('Error saving local user to DB:', e);
      return null;
    }
  }
}

export async function getActiveUsers() {
  const users = await getAllUsers();
  return users.filter(u => u.active === true);
}

export async function getAlertCooldown(chatId, poolId, side) {
  const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const key = `alert:${chatId}:${poolId}:${side}`;
  if (isVercelKV) {
    const res = await kvRequest('GET', [key]);
    if (!res) return null;
    try {
      return JSON.parse(res);
    } catch {
      return { cushion: 0, roi: 0, timestamp: 0 };
    }
  } else {
    if (!global.localCooldowns) global.localCooldowns = {};
    const record = global.localCooldowns[key];
    if (record && Date.now() - record.timestamp < 6 * 60 * 60 * 1000) {
      try {
        return JSON.parse(record.payload);
      } catch {
        return { cushion: 0, roi: 0, timestamp: 0 };
      }
    }
    return null;
  }
}

export async function setAlertCooldown(chatId, poolId, side, data = {}) {
  const isVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const key = `alert:${chatId}:${poolId}:${side}`;
  const payload = JSON.stringify({
    cushion: Number(data.cushion || 0),
    roi: Number(data.roi || 0),
    timestamp: Date.now()
  });
  if (isVercelKV) {
    // Set expiration to 6 hours (21600 seconds)
    await kvRequest('SET', [key, payload, 'EX', '21600']);
  } else {
    if (!global.localCooldowns) global.localCooldowns = {};
    global.localCooldowns[key] = {
      payload,
      timestamp: Date.now()
    };
  }
}
