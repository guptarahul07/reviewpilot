# Google Cloud Project Setup Guide for ReviewPilot
**Goal:** Get Google OAuth credentials to access Google My Business API

**Time Required:** 15-20 minutes  
**Cost:** Free (up to 1,000 API calls/day)

---

## 📝 **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account (use the same email you'll use for testing)

2. **Create New Project:**
   - Click the project dropdown at the top (says "Select a project")
   - Click **"NEW PROJECT"**
   - Enter details:
     - **Project name:** `ReviewPilot`
     - **Organization:** Leave as "No organization"
     - **Location:** Leave as default
   - Click **"CREATE"**
   - Wait 10-20 seconds for project creation

3. **Select Your Project:**
   - Click the project dropdown again
   - Select **"ReviewPilot"** from the list
   - The top bar should now show "ReviewPilot"

✅ **Checkpoint:** You should see "ReviewPilot" in the top navigation bar

---

## 🔌 **Step 2: Enable Google My Business API**

1. **Open API Library:**
   - In the left sidebar, click **"APIs & Services"**
   - Click **"Library"**

2. **Search for API:**
   - In the search box, type: `Google My Business`
   - You'll see two relevant APIs:
     - **"My Business Business Information API"** ← Enable this one
     - **"My Business Account Management API"** ← Enable this one too

3. **Enable Both APIs:**
   - Click on **"My Business Business Information API"**
   - Click the blue **"ENABLE"** button
   - Wait 5-10 seconds
   - Go back and repeat for **"My Business Account Management API"**

✅ **Checkpoint:** Both APIs should show as "Enabled" in your API Dashboard

---

## 🔐 **Step 3: Create OAuth Consent Screen**

This is what users see when they click "Connect Google Account" in your app.

1. **Go to OAuth Consent Screen:**
   - In left sidebar: **"APIs & Services"** → **"OAuth consent screen"**

2. **Choose User Type:**
   - Select **"External"** (allows anyone with a Google account)
   - Click **"CREATE"**

3. **Fill App Information:**

   **App information section:**
   - **App name:** `ReviewPilot`
   - **User support email:** Your Gmail address (e.g., `yourname@gmail.com`)
   - **App logo:** (Optional - skip for now, you can add later)

   **App domain section:**
   - **Application home page:** `https://reviewpilot.com` (or your domain)
   - **Application privacy policy:** `https://reviewpilot.com/privacy`
   - **Application terms of service:** `https://reviewpilot.com/terms`
   
   *(For now, these can be placeholder URLs - you'll create these pages before public launch)*

   **Authorized domains:**
   - Add your domain: `reviewpilot.com` (no https://)
   - If testing on localhost, you can add that later

   **Developer contact information:**
   - Enter your email again

   - Click **"SAVE AND CONTINUE"**

4. **Scopes Section:**
   - Click **"ADD OR REMOVE SCOPES"**
   - In the filter box, search for: `business`
   - Find and check these scopes:
     - ✅ `https://www.googleapis.com/auth/business.manage`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

5. **Test Users Section:**
   - Click **"ADD USERS"**
   - Add your Gmail address (the one you'll use for testing)
   - Add any other email addresses of people who will test the app
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

6. **Summary:**
   - Review everything
   - Click **"BACK TO DASHBOARD"**

✅ **Checkpoint:** OAuth consent screen shows "Publishing status: Testing"

---

## 🔑 **Step 4: Create OAuth Credentials**

1. **Go to Credentials:**
   - Left sidebar: **"APIs & Services"** → **"Credentials"**

2. **Create OAuth Client ID:**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"OAuth client ID"**

3. **Configure Credentials:**
   - **Application type:** Select **"Web application"**
   - **Name:** `ReviewPilot Web Client`

   **Authorized JavaScript origins:**
   - Click **"+ ADD URI"**
   - For local development: `http://localhost:5173` (Vite dev server)
   - For production: `https://reviewpilot.com` (your actual domain)
   - *(You can add both)*

   **Authorized redirect URIs:**
   - Click **"+ ADD URI"**
   - For local development: `http://localhost:5173/auth/google/callback`
   - For production: `https://reviewpilot.com/auth/google/callback`
   - *(You can add both)*

   - Click **"CREATE"**

4. **Save Your Credentials:**
   - A popup will appear showing:
     - **Your Client ID** (looks like: `123456-abcdef.apps.googleusercontent.com`)
     - **Your Client Secret** (looks like: `GOCSPX-aBcDeFgHiJkLmN`)
   
   - **IMPORTANT:** Copy both of these NOW
   - Click **"DOWNLOAD JSON"** to download the credentials file (backup)
   - Click **"OK"**

✅ **Checkpoint:** You should have both Client ID and Client Secret copied

---

## 💾 **Step 5: Add Credentials to Your App**

1. **Open your backend `.env` file:**
   ```
   # backend/.env
   CLAUDE_API_KEY=sk-ant-api03-... (your existing key)
   
   # Add these new lines:
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
   ```

2. **IMPORTANT: Never commit `.env` to Git!**
   - Make sure `.env` is in your `.gitignore` file
   - Only share these credentials through secure channels

3. **For production deployment:**
   - When you deploy to Render/Railway/Heroku, add these as environment variables
   - Update `GOOGLE_REDIRECT_URI` to your production URL

---

## 🧪 **Step 6: Testing Checklist**

Before moving to code implementation, verify:

- [ ] Google Cloud Project "ReviewPilot" is created
- [ ] Both APIs are enabled (Business Information + Account Management)
- [ ] OAuth consent screen is configured
- [ ] Your email is added as test user
- [ ] OAuth credentials are created
- [ ] Client ID and Secret are saved in `.env` file
- [ ] `.env` is in `.gitignore`

---

## 🎯 **What These Credentials Allow You to Do:**

Once you implement the OAuth flow in code:

1. **User clicks "Connect Google Business"** in your app
2. They're redirected to **Google's login page** (you don't handle passwords!)
3. They see: *"ReviewPilot wants to manage your Google Business Profile"*
4. They click **"Allow"**
5. Google gives your app a **token** (like a key to their account)
6. Your app can now:
   - ✅ Fetch their reviews
   - ✅ Post replies to reviews
   - ✅ Get business info (name, address, rating)

**What you CANNOT do:**
- ❌ Access their Gmail, Calendar, Drive (different scopes)
- ❌ Change their business hours or posts (we only requested review scope)
- ❌ See their password (OAuth never shares passwords)

---

## 🔒 **Security Notes**

1. **Client Secret = Password**
   - Never expose it in frontend code
   - Only use it in backend
   - Rotate it if it's ever leaked

2. **Scopes = Permissions**
   - We only requested `business.manage` scope
   - Always request minimum permissions needed
   - Users can revoke access anytime at: https://myaccount.google.com/permissions

3. **Tokens Expire**
   - Access tokens expire in 1 hour
   - Refresh tokens last forever (until revoked)
   - You'll store the refresh token in Firestore (encrypted)
   - Use it to get new access tokens automatically

---

## 🚨 **Common Issues & Fixes**

### Issue 1: "Access blocked: This app's request is invalid"
**Fix:** Make sure redirect URI in Google Cloud matches EXACTLY what's in your code
- Google Cloud: `http://localhost:5173/auth/google/callback`
- Your code: Must use the same URL (no trailing slash, exact port)

### Issue 2: "This app hasn't been verified by Google"
**Fix:** This is normal for apps in "Testing" mode
- Click "Advanced" → "Go to ReviewPilot (unsafe)"
- This warning only shows to non-test users
- To remove, you'll need to submit for verification (after launch)

### Issue 3: "Redirect URI mismatch"
**Fix:** Check two places:
1. Google Cloud Console → Credentials → Your OAuth client → Authorized redirect URIs
2. Your backend code → `GOOGLE_REDIRECT_URI` environment variable
3. They must match EXACTLY (including http/https, trailing slash)

### Issue 4: Can't find "My Business API"
**Fix:** Make sure you're searching for the correct API names:
- "My Business Business Information API"
- "My Business Account Management API"
- (Not the old deprecated "Google My Business API")

---

## 📚 **Additional Resources**

- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **My Business API Docs:** https://developers.google.com/my-business/content/overview
- **OAuth Playground (for testing):** https://developers.google.com/oauthplayground

---

## ✅ **Next Steps**

Once you've completed this setup, you're ready to implement the OAuth flow in code!

**What we'll build next:**
1. Backend OAuth routes (`/auth/google/connect`, `/auth/google/callback`)
2. Token encryption/storage in Firestore
3. Frontend "Connect Google Business" button
4. Success/error handling

**Estimated time to implement:** 2-3 hours

---

## 💬 **Need Help?**

If you get stuck:
1. Check the "Common Issues" section above
2. Google the exact error message
3. Ask me and I'll help debug!

**You're ready to move on when:**
- ✅ You have Client ID and Secret in your `.env` file
- ✅ OAuth consent screen is configured
- ✅ Both APIs are enabled
- ✅ You understand what scopes allow you to do

**Let's build the OAuth flow next!** 🚀
