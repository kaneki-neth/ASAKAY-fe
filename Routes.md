The Routes Module is the core intelligence of the ASAKAY platform. It transforms raw map data into a functional public transportation system. Here  is a breakdown of how the different parts work together:

  ---

  1. What are "Stops" and how are they used?
  Stops are the official designated locations where a vehicle (Jeepney, Bus, etc.) can pick up or drop off passengers.

   * Definition: Each stop consists of a unique name, a specific geographic coordinate (Lat/Long), and a human-readable address.
   * Usage: They act as "nodes" in the transport network. A stop can belong to multiple routes (e.g., a busy intersection might be a stop for 5     
     different Jeepney lines).
   * Data Entry: When you create a stop, the system uses Reverse Geocoding to suggest a name based on the map pointer, but admins can override this 
     with local names like "Green Building Gate" or "Market Corner".

  ---

  2. Process of Making Routes & Adding Stops
  Making a route is a two-part process handled in the Route Form:

  Part A: Drawing the Path (The visual line)
  This defines the physical road the vehicle travels.
   * Anchors: You click the map to place red "Anchors." 
   * Snap to Road: If enabled, the system automatically connects your anchors by following the actual curves and turns of the streets. If disabled  
     (Manual mode), it draws straight lines (for shortcuts or alleys).
   * Adjustment: You can drag these anchors to fine-tune the path or remove them if you make a mistake.

  Part B: Sequencing Stops (The service points)
  While the "Path" shows where the vehicle drives, the "Stops" show where it interacts with users.
   * Sidebar Selection: On the left side of the form, you pick existing Stops from a dropdown.
   * Ordering: You can drag-and-drop or use arrows to set the sequence (e.g., Stop A -> Stop B -> Stop C). 
   * Logic: The order is critical. The navigation engine uses this sequence to know if a route is going "Forward" or "Backward" relative to where   
     the user wants to go.

  ---

  3. The Functionality of the Navigator
  The Navigator is the user-facing tool that answers the question: "How do I get from Point A to Point B?"

  The User Flow:
   1. Set Points: The user clicks the map once for Origin and once for Destination. 
   2. Reverse Geocoding: The system instantly converts those clicks into addresses (e.g., "Manila City Hall" to "Rizal Park").
   3. Pathfinding (Backend):
       * Nearby Search: The engine looks for all Stops within a 500-meter radius of the Origin and Destination.
       * Route Matching: It searches for any Route that passes through one of the "Origin Stops" and later passes through one of the "Destination   
         Stops" in the correct sequence.
   4. Results:
       * Itineraries: The user sees a list of options.
       * Visual Map: The map draws a dashed line for walking to the first stop, a solid colored line (matching the Jeepney/Bus color) for the ride, 
         and another dashed line for the final walk.

  Summary
   * Stops are the static locations.
   * Routes are the lines connecting those stops.
   * Navigator is the search engine that calculates the best combination of stops and routes to complete a journey.