import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Delete the session cookie to destroy the session
  response.cookies.delete('session');
  
  return response;
}