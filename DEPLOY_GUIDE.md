# Setup Development Environment

1.  **Clone the repo**
2.  **Install dependencies**:
    ```bash
    yarn install
    ```
3.  **Setup Database**:
    *   Start local database using Docker:
        ```bash
        docker-compose up -d
        ```
    *   Create a `.env.local` file (copy from below).
4.  **Run Migrations**:
    ```bash
    yarn migrate
    ```
5.  **Start Dev Servers**:
    *   **Frontend**: `yarn dev`
    *   **Socket Server**: `yarn socket`

## Environment Variables (.env.local)

Copy these content to `.env.local`:

```env
# Local Database URL (from docker-compose)
POSTGRES_URL="postgres://postgres:postgres@localhost:5432/twitter"

# Socket Server URL (Client connects to this)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Socket Server Port (Server listens on this)
PORT=3001
```

---

# Deploy to Render.com

You will need to create **3** services on Render.

### 1. PostgreSQL Database
*   Create a new **PostgreSQL**.
*   Name: `twitter-db` (or anything).
*   Copy the **Internal Connection URL** provided by Render.

### 2. Socket Service (Web Service)
*   Create a new **Web Service**.
*   Connect your GitHub repo.
*   **Name**: `twitter-socket`
*   **Build Command**: `yarn install`
*   **Start Command**: `yarn socket`
*   **Environment Variables**:
    *   `PORT`: `3001` (Render might enforce 10000, but set this anyway just in case, code uses process.env.PORT)
*   Copy the **Service URL** (e.g., `https://twitter-socket.onrender.com`).

### 3. Frontend Service (Web Service)
*   Create a new **Web Service**.
*   Connect your GitHub repo.
*   **Name**: `twitter-web`
*   **Build Command**: `yarn build`
*   **Start Command**: `yarn start`
*   **Environment Variables**:
    *   `POSTGRES_URL`: (Paste the **External Connection URL** from Step 1. Note: If deploying both on Render, Internal URL is better but External is easier to debug initially. **Append `?ssl=true`** to the end of the connection string if not present!)
    *   `NEXT_PUBLIC_SOCKET_URL`: (Paste the **Service URL** from Step 2, e.g., `https://twitter-socket.onrender.com`)
*   **Important**: In Render Settings for this service, make sure the "Root Directory" is `.` (default).

## Database Migration on Production
After deploying, the database will be empty. You need to run migrations.
1.  On your local machine, change `.env.local` `POSTGRES_URL` to the **Render External Database URL**.
2.  Run `yarn migrate`.
3.  Change `.env.local` back to localhost.
