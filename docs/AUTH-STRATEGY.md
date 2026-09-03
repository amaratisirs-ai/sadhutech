# Authentication Strategy: Options & Tradeoffs

## What is "Neon Auth"?

**Short answer**: Neon doesn't have a built-in auth service. Neon is just PostgreSQL.

However, there are several auth approaches that work with Neon:

---

## Option 1: Simple API Keys (What I Just Built) ✅ Current

**Cost**: $0  
**Complexity**: 5 minutes to set up  
**Best for**: MVP, beta launch  

```bash
# Environment variable
export GENESIS_API_KEYS="key1,key2,key3"

# User gets key, includes in header
curl -H "X-API-Key: key1" https://genesis-gate.onrender.com/v1/report
```

**Pros**:
- Zero cost
- Works immediately
- No external dependencies
- Easy to rotate/revoke
- Built into Fastify

**Cons**:
- No user accounts (just static keys)
- No "sign up" flow
- Can't track usage per user easily
- Not suitable for public SaaS

**Upgrade path**: Generate keys in database, manage via `/dashboard`

---

## Option 2: Supabase Auth (PostgreSQL + Auth) ⭐ Recommended for SaaS

**Cost**: Free tier (100k MAU), then $25/mo per 100k users  
**Complexity**: 30 minutes to set up  
**Best for**: Full user management + API keys  

Supabase = PostgreSQL + Auth + Realtime (built on Postgres)

```typescript
// In your Next.js app
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sign up
const { user, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
});

// Generate API key for this user
const { data } = await supabase
  .from("api_keys")
  .insert([{ 
    user_id: user.id, 
    key: generateKey(), 
    name: "Default" 
  }]);
```

**Pros**:
- Full user authentication (email, password, OAuth)
- User sessions & JWT tokens
- Can migrate away from Neon if needed
- Analytics included
- Free tier includes 500MB storage

**Cons**:
- New database (replace Neon, or use both)
- Learning curve for Supabase-specific APIs
- ~$25/mo after free tier
- Slightly slower than pure Neon

**Ideal for**: GENESIS when you want user accounts, email verification, OAuth (Google/GitHub login)

---

## Option 3: Auth0 (Third-party SaaS) 

**Cost**: Free tier (7K active users), then $1/user/mo  
**Complexity**: 45 minutes  
**Best for**: Enterprise-grade, many identity providers  

```typescript
// In your Next.js app
import { useAuth0 } from "@auth0/auth0-react";

const { loginWithRedirect, user } = useAuth0();

// User logs in with Google, GitHub, Microsoft, SAML, etc.
```

**Pros**:
- Any identity provider (Google, GitHub, Microsoft, SAML)
- Enterprise features (SSO, MFA)
- Audit logs
- Roles & permissions

**Cons**:
- Expensive ($1/user/mo)
- Overkill for MVP
- Extra HTTP round-trips
- Vendor lock-in

---

## Option 4: Neon Database + Custom Auth Table (DIY)

**Cost**: $0 (use existing Neon)  
**Complexity**: 2 hours  
**Best for**: Full control, keep all data in Neon  

```sql
-- Create in your existing Neon database
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  rate_limit INT DEFAULT 1000,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Then in Node.js:
```typescript
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Sign up
async function signup(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const { data: user } = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
    [email, hash]
  );
  return user;
}

// Generate API key
async function generateApiKey(userId: string, name: string) {
  const key = crypto.randomBytes(16).toString("hex");
  await pool.query(
    "INSERT INTO api_keys (user_id, key, name) VALUES ($1, $2, $3)",
    [userId, key, name]
  );
  return key;
}

// Verify API key
async function verifyApiKey(key: string) {
  const { data } = await pool.query(
    "SELECT user_id FROM api_keys WHERE key = $1",
    [key]
  );
  return data?.[0];
}
```

**Pros**:
- Zero cost
- All data in one place (Neon)
- Full control
- No external dependencies

**Cons**:
- Build it yourself
- Need to handle password hashing, sessions
- No OAuth out of box
- More code to maintain

---

## Recommendation for GENESIS

### **Now** (MVP/Beta - Week 1)
Use **Option 1: Simple API Keys** (already built)
- Free
- Works immediately
- Can distribute keys to beta testers
- Document in `/docs/api-keys.md`

```bash
# Set in Render.com environment
GENESIS_API_KEYS="abc123def456,xyz789..."
```

### **When Launching Pricing** (Week 3-4)
Upgrade to **Option 2: Supabase Auth** OR **Option 4: Neon DIY**

**Supabase** if you want:
- Professional UI (sign up, password reset, 2FA)
- OAuth (Google, GitHub login)
- User management dashboard
- Don't mind $25/mo cost

**Neon DIY** if you want:
- Keep everything in Neon
- Zero cost
- Custom UI
- Don't mind building auth forms

---

## Migration Path (No Lock-in)

```
Week 1: API Keys → Works with beta testers
  ↓
Week 3: Add Supabase/DIY alongside API Keys
  - Old API keys still work
  - New users sign up in dashboard
  - Get key issued automatically
  ↓
Week 5: Supabase becomes primary
  - API keys deprecated
  - Users manage keys in dashboard
  - Analytics per user
```

---

## Quick Start: Which Should You Choose?

| Scenario | Use |
|----------|-----|
| "Just launch beta" | **API Keys** (current) |
| "Need user accounts fast" | **Supabase Auth** |
| "Want full control, no cost" | **Neon DIY** |
| "Enterprise customers" | **Auth0** |

---

## API Key Implementation Details (Current)

Already implemented:
```typescript
// Load from env
export function loadApiKeys(): Set<string> {
  const keysStr = process.env.GENESIS_API_KEYS || "";
  return new Set(keysStr.split(",").map(k => k.trim()));
}

// Verify in middleware
export function createApiKeyMiddleware(authorizedKeys: Set<string>) {
  return async (request, reply) => {
    const apiKey = request.headers["x-api-key"];
    if (!isValidApiKey(apiKey, authorizedKeys)) {
      return reply.status(401).send({ error: "Invalid API key" });
    }
  };
}

// Apply to endpoints
app.post("/v1/report", 
  { onRequest: createApiKeyMiddleware(authorizedApiKeys) },
  handler
);
```

**To use**:
```bash
# 1. Set env var
export GENESIS_API_KEYS="beta-key-1,beta-key-2,beta-key-3"

# 2. Deploy to Render
# Go to Render dashboard → genesis-gate → Environment
# Add: GENESIS_API_KEYS=beta-key-1,beta-key-2

# 3. Share key with tester
curl -H "X-API-Key: beta-key-1" -X POST https://genesis-gate.onrender.com/v1/report \
  -d '{"address":"0x...","category":"phishing","reporterId":"tester1"}'
```

---

## Supabase Alternative (If You Want to Switch)

```bash
# 1. Create project at supabase.io (free)
# 2. Install client
pnpm add @supabase/supabase-js

# 3. Add to NextAuth in /packages/site
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

# 4. Use in signup
const { user } = await supabase.auth.signUp({ email, password });

# 5. Generate API key in database
await supabase.from("api_keys").insert({
  user_id: user.id,
  key: crypto.randomBytes(16).toString("hex"),
});
```

Would replace Neon entirely (Supabase uses PostgreSQL under the hood).

---

## Summary

✅ **Already done**: API key auth (Option 1)  
✅ **Works now**: Set `GENESIS_API_KEYS` env var  
⏳ **Later**: Upgrade to Supabase (Option 2) or DIY (Option 4) when you add user signup

**For now**: Ship with API keys. Tester receives key via email. Easy to revoke, no complexity.

