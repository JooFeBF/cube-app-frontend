// This is a proxy to forward requests to the backend API
import { NextRequest, NextResponse } from 'next/server';

// Add your backend API URL here
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  const url = new URL(request.url);

  try {
    const response = await fetch(`${API_BASE_URL}/${path}${url.search}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  let body;

  try {
    body = await request.json();
  } catch (error) {
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to post data to API' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  const body = await request.json();

  try {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to update data in API' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const headers = new Headers(request.headers);
  const url = new URL(request.url);

  try {
    const response = await fetch(`${API_BASE_URL}/${path}${url.search}`, {
      method: 'DELETE',
      headers,
    });

    // For successful deletion with no content
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to delete data in API' },
      { status: 500 }
    );
  }
}
