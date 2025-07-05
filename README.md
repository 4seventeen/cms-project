# vue-cms

## Project Setup Guide

Follow these steps to set up the project on your local system:

### 1. Prerequisites

- **Node.js** (version 16.x or higher recommended)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

### 2. Clone the Repository

```bash
git clone https://github.com/<your-username>/vue-cms.git
cd vue-cms
```

### 3. Install Dependencies

> **Note:** The `node_modules` directory is not included in the repository (it's in `.gitignore`).  
> You must run the following command to install all required dependencies:

Using npm:
```bash
npm install
```
Or using yarn:
```bash
yarn install
```

### 4. Run the Development Server

Using npm:
```bash
npm run serve
```
Or using yarn:
```bash
yarn serve
```

The app should now be running at [http://localhost:8080](http://localhost:8080) (or the port specified in your config).

### 5. Build for Production

```bash
npm run build
```
Or:
```bash
yarn build
```

### 6. Lint and Fix Files

```bash
npm run lint
```
Or:
```bash
yarn lint
```

### 7. Additional Notes

- If you encounter issues, ensure your Node.js and npm/yarn versions are up to date.
- Check for a `.env.example` file and copy it to `.env` if environment variables are needed.
- For further questions, please open an issue

