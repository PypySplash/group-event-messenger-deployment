# Group Event Messenger

Full-stack group event messenger with real-time WebSocket chat and deployment configuration. Created with Next.js, PostgreSQL, and Drizzle ORM.

## Preview

| Event Dashboard | Real-time Chat Room |
|:---:|:---:|
| <img src="public/dashboard.png" alt="Event Dashboard" width="400"/> | <img src="public/chat.png" alt="Real-time Chat" width="400"/> |

## Features

- **Event Management**: Create, join, and view details for group events.
- **Real-time Chat**: Dedicated chat rooms for each event powered by Socket.io.
- **Event Deletion**: Organizers can manage and remove events.
- **User Avatars**: Automatic avatar generation using DiceBear API.
- **Modern UI**: Clean, responsive interface built with Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js 13](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Real-time**: [Socket.io](https://socket.io/) (Custom server implementation)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Docker](https://www.docker.com/) & [Render](https://render.com/)

## Getting Started

### 1. Requirements

- Node.js 18+
- Docker (for local database)
- Yarn package manager

### 2. Installation

1. Clone the repository:
```bash
git clone https://github.com/pypySplash/group-event-messenger-deployment.git
cd group-event-messenger-deployment
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Database (Local Docker instance or external URL)
POSTGRES_URL="postgres://postgres:postgres@localhost:5432/postgres"

# Chat Server URL (Local default)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### 3. Database Setup

Start the local Postgres container (optional if you have your own DB):
```bash
docker-compose up -d
```

Push the schema to the database:
```bash
yarn migrate
```

### 4. Running Locally

You need to run **two** terminals for the full application:

**Terminal 1: Next.js App**
```bash
yarn dev
```
Runs on `http://localhost:3000`

**Terminal 2: Socket Server**
```bash
yarn socket
```
Runs on `http://localhost:3001`

## Database Management

You can inspect the database UI using Drizzle Studio:

```bash
yarn studio
```

## Deployment

This project is configured for deployment on **Render.com**.

It requires three services:
1. **PostgreSQL** (Managed Database)
2. **Web Service** (Next.js App)
3. **Web Service** (Socket Server)

Please refer to [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) for detailed step-by-step specific deployment instructions.
