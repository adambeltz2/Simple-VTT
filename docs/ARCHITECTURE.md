# **Technical Specification: Minimalist P2P VTT**

**WebRTC-Driven Serverless Virtual Tabletop Architecture**

## **1\. User Vision and Requirements**

### **The Vision**

The goal is to create a frictionless, zero-setup Virtual Tabletop that gets out of the way of the game. Modern VTTs often present an overwhelming barrier to entry with heavy ruleset automation, complex 3D rendering, and subscription fees. For Game Masters and players seeking to run streamlined local campaigns, quick remote sessions, or even manage solo role-playing scenarios, the technology should not be a hurdle. The vision is to build a lightweight, instantly accessible web utility where starting a session is as simple as sharing a short alphanumeric code, keeping the focus entirely on the narrative and the tabletop experience.

### **User Requirements**

> * **Zero-Cost and Zero-Install:** Users must not be required to pay for server hosting, nor should they need to download a desktop application to play.  
> * **Frictionless Access:** Players must be able to join a live session instantly by entering a short, generated code into their web browser.  
> * **Streamlined GM Toolkit:** The GM needs intuitive, lightweight controls to switch maps, create and move named tokens, and manage an initiative order without navigating complex menus.  
> * **Real-Time Sync:** The board state and token movements must update instantly across all connected screens.  
> * **System Agnostic:** The application must avoid hardcoding specific RPG rulesets or character sheets, remaining flexible and out-of-the-way for any tabletop system.

## **2\. Architectural Rationale: Why This Stack Was Selected**

To fulfill the vision of a completely free, frictionless, and instant VTT, the traditional client-server model was abandoned in favor of a static, peer-to-peer approach. This strictly eliminates the bottleneck of paid backend game servers and simplifies deployment.

| Technology | Why It Was Selected   |
| :---- | :---- |
| **WebRTC (Data Channels)** | Direct peer-to-peer connection fulfills the "Zero-Cost" and "Real-Time Sync" requirements. By making the GM's browser act as the authoritative host, there are no ongoing cloud computing costs to sync the state, and network latency is minimized. |
| **Static Hosting (e.g., GitHub Pages)** | Aligns with the vision of a lightweight web utility. The entire app is delivered as HTML/JS flat files to the user's browser, enabling free, highly reliable hosting on ubiquitous platforms. |
| **Supabase / PeerJS (Signaling)** | Solves the "Frictionless Access" requirement. WebRTC requires a mechanism to exchange connection data before a P2P link can form. A free-tier database acts purely as a temporary handshake mechanism, allowing users to connect via a 4-digit code without creating permanent user accounts. |
| **HTML5 Canvas API** | Selected over heavy 3D engines to ensure the application remains lightning-fast and accessible on any device, focusing strictly on 2D maps and core token rendering. |

## **3\. Deployment & Infrastructure Strategy**

The infrastructure is designed to incur zero operational costs while delivering real-time, low-latency performance.

> * **Hosting Target:** Static file hosting. The application consists solely of HTML, JS, and CSS.  
> * **Signaling Server:** A free-tier brokering server used strictly to exchange WebRTC Session Description Protocol (SDP) offers and answers via a temporary alphanumeric join code.  
> * **Real-time Transport:** RTCDataChannel. Once connected, all data flows directly between the GM and players. The signaling server is removed from the loop.  
> * **Audio/Video:** Explicitly excluded. Handled externally via Discord to preserve bandwidth and application performance.

## **4\. State Management & Data Architecture**

The GM's browser maintains the authoritative JSON state tree. Connected players receive a full copy upon joining, and subsequently receive delta updates for optimal performance.

### **Primary State Object (JSON)**

{  
  "sessionId": "W4RP",  
  "activeSceneId": "scene\_01",  
  "initiative": \[  
    { "id": "t1", "name": "Rogue", "value": 18 },  
    { "id": "t2", "name": "Goblin 1", "value": 14 }  
  \],  
  "activeTurnIndex": 0,  
  "scenes": {  
    "scene\_01": {  
      "name": "Goblin Cave",  
      "gridSize": 50,  
      "bgImageHash": "a1b2c3d4..."   
    }  
  },  
  "tokens": {  
    "t1": { "scene": "scene\_01", "name": "Rogue", "x": 100, "y": 150, "color": "\#3182ce" },  
    "t2": { "scene": "scene\_01", "name": "Goblin 1", "x": 300, "y": 200, "color": "\#e53e3e" }  
  }  
}

## **5\. Core Systems Specification**

### **5.1 Map & Scene Synchronization**

Managing large image files over WebRTC requires a chunking and background-transfer strategy to prevent channel flooding and interface lag.

> * **Local Processing:** When the GM loads an image, the browser renders it to an off-screen canvas and compresses it to WEBP format.  
> * **Background Transfer:** Images are chunked (typically 64KB blocks) and streamed to players in the background.  
> * **Scene Switching:** The GM issues a lightweight SCENE\_CHANGE event containing the scene ID. Because players already buffered the image chunks, the swap occurs instantaneously.

### **5.2 Token Engine & Rendering**

Tokens are managed via DOM overlays or an optimized HTML5 Canvas to ensure 60fps movement.

> * **Data Bindings:** Tokens consist of an ID, Name, X/Y coordinates, and Hex Color.  
> * **Movement Throttling:** To prevent WebRTC buffer overflow, pointer drag events on the GM's client are throttled to dispatch network updates at \~20 frames per second.  
> * **Client Tweening:** Receiving clients use basic CSS transitions or requestAnimationFrame tweening to interpolate the token's movement between the throttled coordinate updates, creating smooth visual movement.

### **5.3 Initiative & Combat Tracker**

The initiative tracker is a UI-level overlay decoupled from the canvas logic.

> * **Authoritative Control:** Only the GM can add, remove, or reorder the array. Players receive read-only broadcast updates.  
> * **Turn Advancement:** Advancing the turn increments the activeTurnIndex. The updated integer is broadcasted, triggering UI highlights on all clients.

## **6\. WebRTC Payload Protocols**

Data transferred during active gameplay must be extremely lightweight. Below is the specification for the core delta payloads sent over the RTCDataChannel.

| Event Type | Payload Structure | Trigger / Description   |
| :---- | :---- | :---- |
| TOKEN\_MOVE | {"type": "TOKEN\_MOVE", "id": "t1", "x": 150, "y": 250} | Throttled update sent while the GM drags a token. |
| SCENE\_CHANGE | {"type": "SCENE\_CHANGE", "id": "scene\_02"} | GM swaps the active map. Prompts clients to render the new background. |
| INITIATIVE\_UPDATE | {"type": "INITIATIVE\_UPDATE", "data": \[...\]} | Sent when GM reorders the list or alters an entity's turn value. |
| TURN\_ADVANCE | {"type": "TURN\_ADVANCE", "index": 1} | GM clicks "Next Turn". Updates the highlight UI. |

