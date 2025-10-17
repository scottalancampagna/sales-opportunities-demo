# Deploy to Azure Static Web Apps

## Prerequisites
- Azure account
- GitHub account (to host the code)

## Steps

### 1. Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Sales Opportunities App"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/your-username/deal-tracker-fresh.git
git branch -M main
git push -u origin main
```

### 2. Create Azure Static Web App
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web Apps"
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `sales-opportunities-app` (or your preferred name)
   - **Plan type**: Free (perfect for testing)
   - **Region**: Choose closest to your users
   - **Deployment source**: GitHub
   - **GitHub account**: Sign in and authorize
   - **Repository**: Select your `deal-tracker-fresh` repo
   - **Branch**: `main`
   - **Build presets**: React
   - **App location**: `/` (root)
   - **Build location**: `build`

6. Click "Review + Create" then "Create"

### 3. Automatic Deployment
- Azure will automatically build and deploy your app
- You'll get a URL like: `https://your-app-name.azurestaticapps.net`
- Every push to your main branch will trigger a new deployment

## Configuration File (Optional)
Create `staticwebapp.config.json` in your root directory for advanced settings:

```json
{
  "routes": [
    {
      "route": "/",
      "serve": "/index.html",
      "statusCode": 200
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".js": "application/javascript",
    ".css": "text/css"
  }
}
```

## Benefits of Azure Static Web Apps
- ✅ **Free tier**: Perfect for testing and small apps
- ✅ **Global CDN**: Fast loading worldwide
- ✅ **Custom domains**: Add your own domain later
- ✅ **HTTPS**: Automatic SSL certificate
- ✅ **CI/CD**: Automatic deployments from GitHub
- ✅ **Staging environments**: PR previews
