import * as authHandler from './auth.js';
import * as saveDataHandler from './save-data.js';
import * as saveProfileHandler from './save-profile.js';
import * as checkUserHandler from './check-user.js';

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    if (pathname === '/api/auth' && request.method === 'POST') {
      return await authHandler.POST({ request });
    }
    
    else if (pathname === '/api/check-user' && request.method === 'POST') {
      return await checkUserHandler.POST({ request });
    }
    
    else if (pathname === '/api/save-data') {
      const { default: saveDataHandler } = await import('./save-data.js');
      
      if (request.method === 'POST') {
        return await saveDataHandler.POST({ request });
      } else if (request.method === 'GET') {
        return await saveDataHandler.GET({ request });
      }
    }
    
    else if (pathname === '/api/save-profile') {
      const { default: saveProfileHandler } = await import('./save-profile.js');
      
      if (request.method === 'POST') {
        return await saveProfileHandler.POST({ request });
      } else if (request.method === 'GET') {
        return await saveProfileHandler.GET({ request });
      }
    }
    
    else {
      return new Response(JSON.stringify({
        error: 'Endpoint not found'
      }), { status: 404 });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error: ' + error.message
    }), { status: 500 });
  }
}

// Render requires this export
export async function handler(request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  const response = await handleRequest(request);
  
  // Add CORS headers to response
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}