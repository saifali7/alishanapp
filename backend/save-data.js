import { promises as fs } from 'fs';
import path from 'path';

export async function POST({ request }) {
  try {
    const { userId, userEmail, inventoryData } = await request.json();
    
    if (!userId || !userEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID and Email are required'
      }), { status: 400 });
    }
    
    // Use email-based filename for consistency
    const userFile = `./user_data/inventory_${userEmail.replace(/[@.]/g, '_')}.json`;
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(userFile), { recursive: true });
    
    // Save data with metadata
    const saveData = {
      userId: userId,
      userEmail: userEmail,
      inventoryData: inventoryData,
      lastSynced: new Date().toISOString(),
      totalItems: inventoryData.length
    };
    
    await fs.writeFile(userFile, JSON.stringify(saveData, null, 2));
    
    return new Response(JSON.stringify({
      success: true,
      message: `Data saved successfully (${inventoryData.length} items)`
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
    const email = url.searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    
    // Use email-based filename
    const userFile = `./user_data/inventory_${email.replace(/[@.]/g, '_')}.json`;
    
    try {
      const data = await fs.readFile(userFile, 'utf8');
      const parsed = JSON.parse(data);
      return new Response(JSON.stringify(parsed.inventoryData || []), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // Return empty array if file doesn't exist
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}