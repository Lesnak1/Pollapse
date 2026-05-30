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
    const res = await fetch(`${url}/${command}/${args.join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
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
      const url = process.env.KV_REST_API_URL;
      const token = process.env.KV_REST_API_TOKEN;
      await fetch(`${url}/set/user:${idStr}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        cache: 'no-store'
      });
      
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
