import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'lib', 'bot-users.json');

// Initialize empty DB if not exists
if (!fs.existsSync(DB_FILE)) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  } catch (e) {
    console.error('Failed to initialize bot database:', e);
  }
}

export function getAllUsers() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    return db.users || [];
  } catch (e) {
    console.error('Error reading bot DB:', e);
    return [];
  }
}

export function getUser(chatId) {
  const users = getAllUsers();
  const idStr = String(chatId);
  return users.find(u => String(u.chatId) === idStr) || null;
}

export function saveUser(user) {
  try {
    const users = getAllUsers();
    const idStr = String(user.chatId);
    const existingIndex = users.findIndex(u => String(u.chatId) === idStr);

    const userData = {
      chatId: idStr,
      username: user.username || '',
      budget: user.budget !== undefined ? Number(user.budget) : 1500,
      sectors: user.sectors || ['all'],
      risk: user.risk || 'medium', // low, medium (low & med), high (all)
      active: user.active !== undefined ? !!user.active : true,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      userData.createdAt = new Date().toISOString();
      users.push(userData);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify({ users }, null, 2));
    return userData;
  } catch (e) {
    console.error('Error saving user to DB:', e);
    return null;
  }
}

export function getActiveUsers() {
  return getAllUsers().filter(u => u.active === true);
}
