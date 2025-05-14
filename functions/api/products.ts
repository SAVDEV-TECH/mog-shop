 export const onRequestGet = async (context: any) => {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch("https://dummyjson.com/products", {
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Failed to fetch products', response.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch products", status: response.status }), 
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    const data = await response.json();

    // Log the data to check what you are getting
    console.log('Successfully fetched products');

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "max-age=300" // Cache for 5 minutes
      },
    });
  } catch (err) {
    // Check for timeout errors
    if (typeof err === "object" && err !== null && "name" in err && (err as any).name === 'AbortError') {
      console.error('Request timed out');
      return new Response(
        JSON.stringify({ error: "Request to external API timed out" }), 
        { 
          status: 504, // Gateway Timeout
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
    
    console.error('Server error:', err);
    return new Response(
      JSON.stringify({ error: "Server Error", message: (err instanceof Error ? err.message : String(err)) }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};

// Handle OPTIONS requests for CORS preflight
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
};