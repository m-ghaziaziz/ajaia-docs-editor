# Ajaia Docs

A modern, professional full-stack document editing SaaS built with Next.js (App Router), Tiptap, and MySQL. It features passwordless magic-link authentication, real-time autosave, rich text formatting, file importing, and document sharing capabilities.

## Features

- **Rich Text Editing**: Powered by Tiptap (Headless ProseMirror). Supports bold, italic, headings, lists, blockquotes, alignment, and character/word counts.
- **Magic Link Authentication**: Secure, passwordless login flow using JSON Web Tokens (JWT) and HTTP-only cookies.
- **Real-time Autosave**: Documents save automatically as you type, with a debounced indicator (Saving... -> Saved).
- **Document Sharing**: Share your documents with other registered users. Assign either "view" or "edit" permissions.
- **File Import**: Import `.txt`, `.md`, and `.docx` files directly into your workspace. The content is parsed and converted into editable Tiptap documents.
- **Modern Premium UI**: Built with Tailwind CSS, featuring glassmorphism, smooth micro-animations, skeletons, and a tailored dark-theme palette (`var(--color-brand-500)`).

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Editor Core**: Tiptap
- **Database**: MySQL 8 (Designed for Hostinger VPS or any remote MySQL provider)
- **Auth**: `jose` (JWT) + `nodemailer` (Magic Links)
- **Styling**: Tailwind CSS + Lucide Icons + Radix UI primitives
- **File Parsing**: `mammoth` (for `.docx`)

## Getting Started

### 1. Database Setup

You will need a MySQL database. You can host this on Hostinger VPS as intended, or locally using XAMPP/Docker.

1. Execute the SQL schema to create your tables. The schema is located in `schema.sql` at the root of the project.
   ```bash
   mysql -u root -p < schema.sql
   ```

### 2. Environment Variables

Create a `.env.local` file in the root directory and update it with your actual credentials. Use the provided `.env.local` template:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Generate a secure 32+ char random string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# MySQL Connection (Hostinger VPS or Local)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ajaia_docs

# SMTP Configuration (For Magic Links)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password
EMAIL_FROM=Ajaia Docs <noreply@yourdomain.com>

# Uploads
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE_MB=10
```

### 3. Installation & Running

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## File Upload Details

- Uploads are saved to the `/public/uploads` directory.
- The file type is verified before parsing.
- `.txt` files are split into paragraphs.
- `.md` files are converted into basic Tiptap JSON nodes (headings, lists, paragraphs).
- `.docx` files are parsed using `mammoth` into HTML, stripped, and converted to Tiptap JSON.

## License

MIT
