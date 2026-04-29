# Ajaia Docs: Architecture & Technical Overview

Welcome to the architectural deep-dive for **Ajaia Docs**. This document outlines the structural decisions, technology stack, and core workflows that power our modern, high-performance document editing SaaS.

---

## 1. High-Level Architecture

Ajaia Docs is a monolithic full-stack application built entirely on the **Next.js App Router** architecture. By unifying the frontend and backend into a single repository, we eliminate cross-origin complexity, simplify our deployment pipeline, and ensure end-to-end type safety using TypeScript.

### The Stack
*   **Frontend**: React, Next.js (Server Components & Client Components), Tailwind CSS, Lucide Icons.
*   **Editor Engine**: Tiptap (Headless ProseMirror wrapper).
*   **Backend**: Next.js API Routes (Node.js runtime).
*   **Database**: MySQL 8.0 (Relational schema designed for scale).
*   **Authentication**: Passwordless Magic Links via `nodemailer` and `jose` (JSON Web Tokens).
*   **Infrastructure**: Hostinger VPS, PM2 (Process Management), Nginx (Reverse Proxy & Static Asset Serving).

---

## 2. Core Workflows & Logic

### Authentication (Passwordless Flow)
We chose a passwordless authentication model to reduce user friction and enhance security.
1.  **Request**: User enters their email. The backend upserts the user record and generates a 15-minute TTL JSON Web Token (JWT) using the `jose` library.
2.  **Delivery**: The token is embedded into a magic link and emailed via `nodemailer` (SMTP).
3.  **Verification**: When clicked, the Next.js API verifies the token against the `magic_links` table (checking `used_at` and `expires_at` using strictly matched Node.js time).
4.  **Session Creation**: A persistent session is created, and an `HttpOnly` cookie is returned to the client, protecting against XSS attacks.

### Document Editor & Autosave
The editing experience is built for speed and reliability, mimicking desktop-class applications like Google Docs.
*   **Tiptap Integration**: We use a headless Tiptap editor configured with essential extensions (Typography, Character Count, Text Align, and Image Attachments).
*   **Debounced Autosaving**: To prevent overloading the MySQL database, keystrokes are captured in a React `useRef` and saved via a debounced `PATCH` request every 2 seconds. The UI clearly reflects the state (`Saving...` -> `Saved`).
*   **View-Only Mode**: When a user opens a shared document with "View" access, the `canEdit` flag physically locks the Tiptap instance (`editable: false`) and suppresses all autosave triggers at the frontend level.

### File Parsing & Importing
A robust import system allows users to drag-and-drop existing files into their workspace.
*   **Text/Markdown**: Parsed natively and split into structured Tiptap JSON nodes.
*   **Word Documents (.docx)**: Processed using the `mammoth` library, which safely converts complex Word XML into clean HTML, before being ingested by Tiptap's parser.

### Image Attachments
Images uploaded directly into the document bypass standard Next.js routing for maximum performance.
*   The `/api/documents/upload-image` endpoint validates permissions and saves the binary payload directly to `/public/uploads`.
*   The frontend receives the URL and uses Tiptap's Image extension to inject it into the editor at the cursor position.

---

## 3. Database Schema Design

Our MySQL schema is heavily normalized to ensure data integrity and fast querying:

*   **`users`**: Stores core identity (`id`, `email`, `name`).
*   **`sessions` & `magic_links`**: Manages auth lifecycles securely.
*   **`documents`**: The source of truth for content. Stores raw `content` (JSON), plain `content_text` (for word counts), and metadata (`owner_id`, `last_saved_at`).
*   **`document_shares`**: A junction table that resolves access control. Maps `document_id` to a `shared_with` user ID and defines their `permission` level (`view` or `edit`).

---

## 4. Production Deployment & Infrastructure

Our deployment strategy on the VPS is tailored for stability and high performance:

1.  **PM2**: The application is managed by PM2 running on a dedicated port (`3050`), ensuring the Node process automatically restarts upon crashes or server reboots.
2.  **Nginx as a Reverse Proxy**: Nginx sits at the edge (listening on ports 80/443). It securely proxies dynamic requests to `localhost:3050`.
3.  **Direct Static Serving**: To bypass Next.js overhead, Nginx is configured to directly serve the `/uploads/` directory from the disk (`alias /var/www/ajaia.ordix.cloud/public/uploads/`). This prevents broken images caused by Next.js build-time snapshotting and allows us to handle file sizes up to 50MB (`client_max_body_size`).
4.  **SSL/TLS**: Secured seamlessly via Let's Encrypt (Certbot), ensuring all traffic is encrypted over HTTPS.

---

## 5. Future Scalability Considerations

As Ajaia Docs grows, the architecture is primed for the following upgrades:
*   **Real-time Collaboration**: The current autosave engine can be upgraded to Y.js and Hocuspocus (WebSockets) to support real-time, multi-user cursor tracking.
*   **Cloud Storage**: Local disk uploads (`/public/uploads`) can easily be swapped for AWS S3 or Cloudflare R2 by updating the upload API route.
*   **Redis Caching**: Introducing Redis for session validation and rate-limiting will reduce MySQL load during high-traffic spikes.
