# Project Gantt Chart Manager - Frontend

Next.js frontend for the Project Gantt Chart Manager application.

## Features

- Modern React 19 with Next.js 15
- Tailwind CSS for styling
- Radix UI components
- Excel file upload and display
- Audio recording and transcription
- Task management interface
- Responsive design

## Deployment to Vercel

### Prerequisites

1. Vercel account
2. Railway.app backend deployed ✅ (https://web-production-a8efc.up.railway.app)
3. Git repository with this code

### Deployment Steps

1. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Create a new project
   - Connect your GitHub repository

2. **Environment Variables**
   Set the following environment variable in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://web-production-a8efc.up.railway.app
   ```

3. **Deploy**
   - Vercel will automatically detect the Next.js project
   - It will use the `vercel.json` configuration
   - The build will use `npm run build`

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - URL of the Railway.app backend (required for production)
  - Production: `https://web-production-a8efc.up.railway.app`
  - Development: `http://localhost:8000`

## Build Commands

- `npm run build` - Build for production
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
