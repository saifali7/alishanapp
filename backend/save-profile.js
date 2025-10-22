import { promises as fs } from 'fs';
import path from 'path';

const profilesDir = './user_data/profiles';

export async function POST({ request }) {
  try {
    const { userId, userEmail, profileData } = await request.json();
    
    if (!userId || !profileData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID and profile data are required'
      }), { status: 400 });
    }
    
    // Ensure profiles directory exists
    await fs.mkdir(profilesDir, { recursive: true });
    
    // Save profile data
    const profileFile = path.join(profilesDir, `${userId}.json`);
    await fs.writeFile(profileFile, JSON.stringify(profileData, null, 2));
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Profile saved successfully'
    }), { status: 200 });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }), { status: 400 });
    }
    
    // Load profile data
    const profileFile = path.join(profilesDir, `${userId}.json`);
    
    try {
      const data = await fs.readFile(profileFile, 'utf8');
      const profileData = JSON.parse(data);
      
      return new Response(JSON.stringify({
        success: true,
        profile: profileData
      }), { status: 200 });
      
    } catch (error) {
      // Return empty profile if not found
      return new Response(JSON.stringify({
        success: true,
        profile: {
          userId: userId,
          avatar: null,
          updatedAt: new Date().toISOString()
        }
      }), { status: 200 });
    }
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}