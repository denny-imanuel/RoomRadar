# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Development Setup

Follow these steps to set up your local development environment.

### 1. Install Dependencies

First, install the required npm packages:

```bash
npm install
```

### 2. Environment Variables

The application requires API keys for Google Maps and Xendit.

1.  Rename the `.env.local.example` file to `.env.local`.
2.  Open the `.env.local` file and add your secret keys.

```
# .env.local

# Get your key from the Google Cloud Console: https://console.cloud.google.com/google/maps-apis/
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Get your secret key from the Xendit Dashboard: https://dashboard.xendit.co/
XENDIT_SECRET_KEY="YOUR_XENDIT_SECRET_KEY"
```

### 3. Populating Firestore with Mock Data

The project includes a script to populate your Firestore database with mock data for users, buildings, and rooms. This is useful for development and testing.

**Step 1: Get Firebase Admin Credentials**

1.  Go to your [Firebase Console](https://console.firebase.google.com/).
2.  Select your project, go to **Project settings** (gear icon) > **Service accounts**.
3.  Click **"Generate new private key"** and confirm. A JSON file will be downloaded.
4.  Rename this file to `serivceAccountKey.json`.
5.  Move the `serivceAccountKey.json` file to the root directory of this project. **Important**: This file contains sensitive credentials. Do not commit it to version control. The `.gitignore` file is already configured to ignore it.

**Step 2: Run the Population Script**

Once the service account key is in place, run the following command from your terminal:

```bash
npm run db:populate
```

This will execute the script at `scripts/populate-firestore.ts`, which writes mock data to your Firestore database.

### 4. Running for Development

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

### 5. Running Tests

To run the unit tests for the Xendit service, use the following command:

```bash
npm test
```

This will execute the tests in `src/lib/xendit-service.test.ts`, which use mocking to simulate API calls without needing live keys.

### 6. Building and Deploying for Production

To create a production build, run:

```bash
npm run build
```

After the build is complete, you can start the production server with:

```bash
npm start
```

## Managing Users (Tenants and Landlords)

This application uses Firebase Authentication to manage users and Firestore to store user-specific data, including their role (Tenant or Landlord). You can add new users in two primary ways:

### 1. Using the Application's Sign-Up Page (Recommended)

This is the standard method for new users to create an account. The application is designed to handle both the authentication record and the corresponding user profile document in Firestore.

1.  **Navigate to the Sign-Up Page**: Open your application and go to the `/signup` route.
2.  **Select a Role**: Choose whether the user is a "Tenant" or a "Landlord".
3.  **Fill in the Details**: Complete the form with the user's first name, last name, email, and a secure password.
4.  **Create Account**: Click the "Create Account" button.

### 2. Manually Adding Users via the Firebase Console (For Administrators)

If you need to add users manually as an administrator, you must perform two steps: create the authentication record and create the user profile in Firestore.

**Step 1: Add User to Firebase Authentication**

1.  Go to your [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  In the left-hand menu, go to **Build > Authentication**.
4.  Click the **"Add user"** button.
5.  Enter the user's email and a temporary password.
6.  Click **"Add user"**. A new user will be created and assigned a unique User ID (UID). Copy this UID for the next step.

**Step 2: Create User Document in Firestore**

1.  In the Firebase Console, go to **Build > Firestore Database**.
2.  Navigate to the `users` collection.
3.  Click **"Start collection"** if it doesn't exist, or **"Add document"** if it does.
4.  For the **Document ID**, paste the User ID (UID) you copied from the Authentication step.
5.  Create the following fields in the document:
    - `id` (String): The same User ID (UID).
    - `email` (String): The user's email address.
    - `firstName` (String): The user's first name.
    - `lastName` (String): The user's last name.
    - `role` (String): Set this to either `tenant` or `landlord`.
    - `dateJoined` (String): The date of creation in ISO format (e.g., `2024-01-01T12:00:00.000Z`).
    - `phone` (String): Leave blank or add a phone number.
    - `profilePicture` (String): Leave blank or add a URL to a profile picture.
6.  Click **"Save"**.
