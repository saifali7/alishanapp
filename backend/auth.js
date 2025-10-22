import { promises as fs } from 'fs';
import path from 'path';

const usersFile = './user_data/users.json';
const profilesDir = './user_data/profiles';

// Load users from file
async function loadUsers() {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if file doesn't exist
    return [];
  }
}

// Save users to file
async function saveUsers(users) {
  await fs.mkdir(path.dirname(usersFile), { recursive: true });
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
}

// Save user profile
async function saveUserProfile(userId, profileData) {
  try {
    await fs.mkdir(profilesDir, { recursive: true });
    const profileFile = path.join(profilesDir, `${userId}.json`);
    await fs.writeFile(profileFile, JSON.stringify(profileData, null, 2));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

// Load user profile
async function loadUserProfile(userId) {
  try {
    const profileFile = path.join(profilesDir, `${userId}.json`);
    const data = await fs.readFile(profileFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function POST({ request }) {
  try {
    const { action, email, password } = await request.json();
    
    const users = await loadUsers();
    
    if (action === 'register') {
      // Check if user already exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User already exists with this email'
        }), { status: 400 });
      }
      
      // Create new user
      const newUser = {
        email: email,
        password: password, // Note: In production, use bcrypt for hashing
        userId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      users.push(newUser);
      await saveUsers(users);
      
      // Create empty profile
      const profileData = {
        userId: newUser.userId,
        email: newUser.email,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveUserProfile(newUser.userId, profileData);
      
      return new Response(JSON.stringify({
        success: true,
        userId: newUser.userId,
        email: newUser.email
      }), { status: 200 });
    }
    
    if (action === 'login') {
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email or password'
        }), { status: 401 });
      }
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      await saveUsers(users);
      
      // Load user profile
      const userProfile = await loadUserProfile(user.userId);
      
      return new Response(JSON.stringify({
        success: true,
        userId: user.userId,
        email: user.email,
        profile: userProfile
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), { status: 400 });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

// New endpoint for profile management
export async function PUT({ request }) {
  try {
    const { userId, profileData } = await request.json();
    
    if (!userId || !profileData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID and profile data are required'
      }), { status: 400 });
    }
    
    await saveUserProfile(userId, profileData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Profile updated successfully'
    }), { status: 200 });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}