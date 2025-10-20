# Mailgun Setup Guide for Thanksgiving Menu Collection

## 🚀 **Complete Setup Instructions**

### **Step 1: Create Mailgun Account**
1. Go to https://www.mailgun.com/
2. Sign up for free account (5,000 emails/month free)
3. Verify your email address

### **Step 2: Get SMTP Credentials**
1. Login to Mailgun dashboard
2. Go to **Sending** → **Domains**
3. Use the **sandbox domain** (for testing) or add your own domain
4. Click on your domain → **SMTP** tab
5. Copy these credentials:
   ```
   SMTP Hostname: smtp.mailgun.org
   Port: 587
   Username: postmaster@your-domain.mailgun.org
   Password: [your-smtp-password]
   ```

### **Step 3: Environment Configuration**

#### **Development (.env file)**
```bash
# Copy the example and update with your Mailgun credentials
cp env.email.example .env

# Edit .env with your actual Mailgun credentials:
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-actual-mailgun-smtp-password
SMTP_FROM=noreply@thanksgiving-menu.com
```

#### **Railway Test Environment**
1. Go to Railway dashboard
2. Select your test service
3. Go to **Variables** tab
4. Add these environment variables:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASS=your-actual-mailgun-smtp-password
   SMTP_FROM=noreply@thanksgiving-menu.com
   ```

#### **Railway Production Environment**
1. Go to Railway dashboard
2. Select your production service
3. Go to **Variables** tab
4. Add the same environment variables as test

### **Step 4: Test the Setup**

#### **Development Testing**
1. Create `.env` file with Mailgun credentials
2. Restart development server: `npm run dev`
3. Test password reset functionality
4. Check Mailgun dashboard for sent emails

#### **Railway Testing**
1. Deploy to test environment
2. Test password reset on test URL
3. Verify emails are sent via Mailgun dashboard

### **Step 5: Domain Configuration (Optional)**

For production, you can use your own domain:
1. Add your domain in Mailgun dashboard
2. Add DNS records as instructed
3. Update `SMTP_FROM` to use your domain
4. Update `SMTP_USER` to use your domain

## 🔧 **Troubleshooting**

### **Common Issues**
- **Authentication failed**: Check SMTP credentials
- **Domain not verified**: Use sandbox domain for testing
- **Rate limits**: Free tier has limits, upgrade if needed

### **Testing Commands**
```bash
# Test email service connection
curl -X POST http://localhost:3000/auth/forgot-password \
  -d "username=admin" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

## 📧 **Email Templates**

The system includes professional HTML email templates for:
- Password reset requests
- Username recovery
- Professional Thanksgiving-themed design

## 🛡️ **Security Features**

- Rate limiting (3 attempts per hour)
- Secure token generation
- One-time use tokens
- 1-hour expiration
- Username enumeration protection

## 📊 **Monitoring**

Check Mailgun dashboard for:
- Email delivery status
- Bounce rates
- Delivery statistics
- Failed deliveries

## 💰 **Pricing**

- **Free tier**: 5,000 emails/month
- **Paid plans**: Start at $35/month for higher limits
- **Perfect for**: Password resets, notifications, transactional emails
