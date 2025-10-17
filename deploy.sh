#!/bin/bash

# Azure Deployment Script for Sales Opportunities App
# This script will build and prepare the app for Azure deployment

echo "🚀 Building Sales Opportunities App for Azure..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building production version..."
npm run build

echo "✅ Build complete!"
echo ""
echo "📁 Your built app is in the 'build' folder"
echo ""
echo "🔷 Next steps for Azure deployment:"
echo "1. Push your code to GitHub"
echo "2. Create an Azure Static Web App"
echo "3. Connect it to your GitHub repository"
echo ""
echo "Or upload the 'build' folder contents to any Azure App Service"
echo ""
echo "🌐 The app will be available at your Azure URL with these demo accounts:"
echo "   Admin: scott.campagna@nttdata.com (password: demo)"
echo "   GTM Lead: sarah.johnson@nttdata.com (password: demo)" 
echo "   POC: david.kim@nttdata.com (password: demo)"
