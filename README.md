# RoomRadar

This is a Next.js and Firebase starter project for a room rental application.

## Getting Started

### 1. Setup

**Install Dependencies:**

```bash
# From the root directory
npm install
npm install --prefix functions
```

**Create Environment File:**

Create a `.env` file in the root directory and add your API keys:

```bash
# .env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
XENDIT_SECRET_KEY="YOUR_XENDIT_SECRET_KEY"
```

**Populate Database (Optional):**

To populate your Firestore database with mock data, you'll need a Firebase service account key.

1.  Download your service account JSON file from the Firebase console.
2.  Rename it to `serviceAccountKey.json` and place it in the root directory.
3.  Run the following command:

```bash
npm run deploy:database
```

### 2. Testing

**Run Frontend Tests:**

```bash
npm run test:frontend
```

**Run Backend Tests:**

```bash
npm run test:backend
```

### 3. Deployment

**Deploy Frontend (Next.js):**

1.  Build the Next.js application:

```bash
npm run build
```

2.  Deploy the static assets from the `out` directory to your hosting provider (e.g., Firebase Hosting).

**Deploy Backend (Firebase Functions):**

```bash
npm run deploy:backend
```
