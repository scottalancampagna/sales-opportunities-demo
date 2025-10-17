# Azure Deployment Options

## 🔷 Option 1: Azure Static Web Apps (Recommended - FREE)

**Best for**: Testing, demos, small teams
**Cost**: Free tier available
**Setup time**: 5 minutes

### Quick Deploy Steps:
1. **Push to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Sales Opportunities App"
   # Create repo on GitHub, then:
   git remote add origin YOUR_GITHUB_URL
   git push -u origin main
   ```

2. **Create Static Web App**:
   - Go to [portal.azure.com](https://portal.azure.com)
   - Create Resource → Static Web Apps
   - Connect to your GitHub repo
   - Build preset: **React**
   - App location: **/**
   - Build location: **build**

3. **Done!** Your app deploys automatically at `https://yourapp.azurestaticapps.net`

---

## 🔷 Option 2: Azure App Service (Traditional Web App)

**Best for**: Production environments, custom domains
**Cost**: ~$13/month (B1 Basic plan)
**Setup time**: 10 minutes

### Deploy Steps:
1. **Build the app**:
   ```bash
   ./deploy.sh
   ```

2. **Create App Service**:
   - Azure Portal → Create Resource → Web App
   - Runtime: **Node.js 18**
   - Region: Choose your preferred location
   - Pricing: **B1 Basic** (cheapest paid tier)

3. **Deploy via ZIP**:
   - Zip the contents of `build/` folder
   - Go to your App Service → Deployment Center
   - Choose "ZIP Deploy"
   - Upload your zip file

---

## 🔷 Option 3: Azure Container Instances

**Best for**: Docker experience, microservices
**Cost**: Pay-per-use (~$30/month)
**Setup time**: 15 minutes

### Steps:
1. **Create Dockerfile** (already provided)
2. **Build and push to Azure Container Registry**
3. **Deploy to Container Instances**

---

## 🔷 Option 4: Azure Blob Storage + CDN (Ultra Cheap)

**Best for**: Static hosting, global distribution
**Cost**: ~$1-5/month
**Setup time**: 10 minutes

### Steps:
1. **Build the app**: `./deploy.sh`
2. **Create Storage Account** with static website hosting
3. **Upload build files** to `$web` container
4. **Optional**: Add Azure CDN for performance

---

## ⚡ Super Quick Start (Recommended)

If you want to get this deployed in under 5 minutes:

1. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

2. **Create GitHub repo and push**:
   - Go to github.com → New repository
   - Name it `sales-opportunities-demo`
   - Copy the git commands it shows you
   - Run them in your terminal

3. **Create Azure Static Web App**:
   - [Direct Link to Create](https://portal.azure.com/#create/Microsoft.StaticApp)
   - Connect to your GitHub repo
   - Choose "React" preset
   - Click Create

4. **Share the URL** that Azure gives you!

## 🎯 What Your Testers Will Get

- **Live demo URL** they can access from anywhere
- **3 demo accounts** to test different role permissions
- **Full functionality** - create opportunities, manage users, export data
- **Mobile responsive** - works on phones and tablets
- **Persistent data** - all data stored in browser localStorage

## 💡 Pro Tips

- **Custom domain**: Add your own domain in Azure Static Web Apps settings
- **Authentication**: Can add Azure AD login later if needed  
- **Analytics**: Add Azure Application Insights for usage tracking
- **Scaling**: Azure Static Web Apps scales automatically
- **SSL**: HTTPS enabled by default

## 🔒 Security Notes

- All data is stored in browser localStorage (no server-side database)
- Perfect for demos and concept testing
- For production, you'd want to add a real backend database