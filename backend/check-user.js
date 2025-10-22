import { promises as fs } from 'fs';

const usersFile = './user_data/users.json';

async function loadUsers() {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), { status: 400 });
    }
    
    const users = await loadUsers();
    const userExists = users.some(user => user.email === email);
    
    return new Response(JSON.stringify({
      success: true,
      exists: userExists
    }), { status: 200 });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}