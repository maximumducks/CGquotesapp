import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Fetching quote from API...');
    
    // Using fetch with no-cors mode as a workaround
    const response = await fetch('https://api.quotable.io/random', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }
    });

    console.log('API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched quote:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error in quote API route:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Try alternative API endpoint if the first one fails
    try {
      console.log('Trying alternative API endpoint...');
      const response = await fetch('http://api.quotable.io/random', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Alternative API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Successfully fetched quote from alternative endpoint:', data);
      return NextResponse.json(data);
    } catch (altError) {
      console.error('Alternative API also failed:', altError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch quote',
          details: 'Both API endpoints failed to respond'
        },
        { status: 500 }
      );
    }
  }
} 