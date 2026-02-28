# 🚀 Zen Planner - Deployment Guide

This guide will walk you through deploying Zen Planner to **Vercel** or **Cloudflare Pages**.

---

## 📋 Prerequisites

- GitHub account (for code hosting)
- Vercel account (free tier available) - [vercel.com](https://vercel.com)
- Cloudflare account (free tier available) - [dash.cloudflare.com](https://dash.cloudflare.com)

---

## 🟢 Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the easiest option since Next.js is built by Vercel and has first-class support.

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Zen Planner app"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/zen-planner.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Click **"Deploy"**
6. Wait for deployment to complete (usually 2-3 minutes)
7. Your app will be live at `https://your-project.vercel.app`

### Step 3: Set Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your custom domain
4. Update DNS records as instructed

---

## 🟠 Option 2: Deploy to Cloudflare Pages

Cloudflare Pages offers free hosting with global CDN and excellent performance.

### Step 1: Push to GitHub

Same as Step 1 above for Vercel.

### Step 2: Create Cloudflare Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **"Workers & Pages"** in the sidebar
3. Click **"Create application"**
4. Select **"Pages"** tab
5. Click **"Connect to Git"**
6. Authorize GitHub and select your repository

### Step 3: Configure Build Settings

Configure these settings in Cloudflare:

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `npx @cloudflare/next-on-pages` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `/` |
| **Node.js version** | `20` (Environment Variables) |

### Step 4: Add Environment Variables

In Cloudflare Dashboard → Settings → Environment Variables:

```
NODE_VERSION=20
```

### Step 5: Deploy

1. Click **"Save and Deploy"**
2. Wait for build to complete (3-5 minutes)
3. Your app will be live at `https://your-project.pages.dev`

---

## 📱 Deploy as PWA (Progressive Web App)

Zen Planner is already configured as a PWA! Users can install it on their devices:

### On Desktop (Chrome/Edge):
1. Visit your deployed app
2. Click the install icon in the address bar
3. Click **"Install"**

### On Mobile (iOS):
1. Visit your deployed app in Safari
2. Tap the Share button
3. Select **"Add to Home Screen"**

### On Mobile (Android):
1. Visit your deployed app in Chrome
2. Tap the menu (three dots)
3. Select **"Add to Home Screen"**

---

## 🔧 Post-Deployment Checklist

- [ ] Test all features work correctly
- [ ] Test AI Advisor chat functionality
- [ ] Verify PWA installation works
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Enable analytics (Vercel Analytics or Cloudflare Web Analytics)

---

## 🆘 Troubleshooting

### Build Fails on Cloudflare

If you encounter build errors on Cloudflare, try:

1. Make sure Node.js version is set to 20
2. Clear build cache and redeploy
3. Check build logs for specific errors

### AI Advisor Not Working

The AI Advisor requires the `z-ai-web-dev-sdk` which works in serverless environments like Vercel and Cloudflare Workers. If it's not working:

1. Check browser console for errors
2. Verify the API routes are being hit
3. Check server logs in your hosting dashboard

### PWA Not Installing

1. Make sure you're accessing via HTTPS
2. Clear browser cache and try again
3. Check that manifest.json is accessible at `/manifest.json`

---

## 🌐 Recommended: Vercel vs Cloudflare

| Feature | Vercel | Cloudflare |
|---------|--------|------------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Next.js Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Free Tier | Generous | Generous |
| Global CDN | ✅ | ✅ |
| Custom Domains | ✅ | ✅ |
| API Routes | ✅ Full support | ✅ Workers |
| Build Speed | Fast | Fast |

**Recommendation**: Start with **Vercel** for the best Next.js experience, then consider Cloudflare if you need their specific features or already use Cloudflare for DNS.

---

## 📞 Need Help?

If you encounter any issues:

1. Check the build logs in your hosting dashboard
2. Ensure all dependencies are properly installed
3. Try a fresh build by clearing cache
4. Open an issue on GitHub with error details

---

**Happy deploying! 🎉**
