# Deploy su Vercel con Server-Side Proxy

Guida completa per deployare 8004.dev su Vercel con autenticazione sicura server-side.

## 🔒 Architettura di Sicurezza

### Prima (Non Sicuro)
```
Browser → Activity API
          (credenziali esposte nel bundle JS)
```

### Ora (Sicuro)
```
Browser → Vercel Serverless Functions → Activity API
          (credenziali server-side)
```

Le credenziali sono **mai** esposte al client!

---

## 📋 Setup Pre-Deploy

### 1. Verifica File Configurazione

Assicurati che questi file siano configurati:

**`svelte.config.js`**:
```javascript
import adapter from '@sveltejs/adapter-vercel';
```

**`.env`** (locale, NON committare):
```bash
# WebSocket URL (pubblico, ok esporre)
PUBLIC_WS_URL=wss://api-8004-dev.fly.dev/ws

# Credenziali (SERVER-SIDE, mai esposte)
API_USERNAME=admin
API_PASSWORD=your_actual_password_here
```

### 2. Installa Dipendenze

```bash
npm install
```

### 3. Test Build Locale

```bash
npm run build
```

Verifica che il build completi senza errori e che vedi:
```
✓ Using @sveltejs/adapter-vercel
  ✔ done
```

---

## 🚀 Deploy su Vercel

### Opzione A: Deploy tramite Dashboard (Raccomandato)

1. **Collegare Repository**:
   - Vai su [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Importa il repository GitHub

2. **Configurare Build Settings**:
   - **Framework Preset**: SvelteKit
   - **Build Command**: `npm run build`
   - **Output Directory**: `.svelte-kit` (auto-detected)
   - **Install Command**: `npm install`

3. **Configurare Environment Variables** ⚠️ **IMPORTANTE**:

   Click "Environment Variables" e aggiungi:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `PUBLIC_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` | Production, Preview, Development |
   | `PUBLIC_CHAIN_ID` | `11155111` | Production, Preview, Development |
   | `PUBLIC_IPFS_PROVIDER` | `pinata` | Production, Preview, Development |
   | `PUBLIC_PINATA_JWT` | `your_pinata_jwt_token` | Production, Preview, Development |
   | `PUBLIC_WS_URL` | `wss://api-8004-dev.fly.dev/ws` | Production, Preview, Development |
   | `API_USERNAME` | `admin` | **Production ONLY** |
   | `API_PASSWORD` | `your_api_password` | **Production ONLY** |

   ⚠️ **ATTENZIONE**:
   - `API_USERNAME` e `API_PASSWORD` devono essere **NON pubbliche** (senza `PUBLIC_`)
   - NON aggiungere mai credenziali a variabili che iniziano con `PUBLIC_`

4. **Deploy**:
   - Click "Deploy"
   - Attendi che il build completi (~2-3 minuti)

### Opzione B: Deploy tramite CLI

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Configura environment variables (richiesto solo la prima volta)
vercel env add API_USERNAME
# Inserisci: admin
# Scope: Production

vercel env add API_PASSWORD
# Inserisci: your_actual_password
# Scope: Production

# Deploy production
vercel --prod
```

---

## ✅ Verifica Deploy

### 1. Check Homepage

Visita il tuo sito Vercel: `https://your-project.vercel.app`

L'Activity Feed dovrebbe:
- ✅ Mostrare lo stato "○ CONNECTING..."
- ✅ Poi cambiare a "● LIVE" quando connesso
- ✅ Mostrare eventi recenti

### 2. Check API Routes

Testa i proxy endpoints:

```bash
# Health check (dovrebbe restituire 401 Unauthorized - corretto!)
curl https://your-project.vercel.app/api/activity/events

# Login (dovrebbe restituire JWT token)
curl -X POST https://your-project.vercel.app/api/activity/login

# Se funziona, vedrai:
# {"token":"jwt_token_here","expires_at":"..."}
```

### 3. Verifica Sicurezza 🔒

**TEST IMPORTANTE**: Apri DevTools → Sources → Cerca "API_PASSWORD"

✅ **Risultato Corretto**: Non trovi nulla
❌ **Problema**: Se trovi la password, hai esposto variabili `PUBLIC_*`

### 4. Check Browser Console

Apri DevTools → Console, dovresti vedere:

```
ActivityFeed mounting with API integration
Attempting secure auto-login via server-side proxy...
Auto-login successful (server-side)
Loaded X recent events from API
Connecting to WebSocket...
WebSocket connected to activity feed
```

---

## 🔧 Troubleshooting

### Problema: "Server configuration error: API_PASSWORD not set"

**Causa**: Variabili d'ambiente non configurate su Vercel

**Soluzione**:
1. Vai su Vercel Dashboard → Your Project → Settings → Environment Variables
2. Aggiungi `API_USERNAME` e `API_PASSWORD`
3. **IMPORTANTE**: Seleziona solo "Production" (NON Public)
4. Redeploy: Settings → Deployments → Latest → "Redeploy"

### Problema: Activity Feed mostra "✕ ERROR"

**Causa**: API non raggiungibile o credenziali errate

**Soluzione**:
1. Check browser console per errore dettagliato
2. Verifica che API sia online: `curl https://api-8004-dev.fly.dev/health`
3. Verifica credenziali:
   ```bash
   # Locale
   curl -X POST http://localhost:5173/api/activity/login

   # Production
   curl -X POST https://your-project.vercel.app/api/activity/login
   ```

### Problema: Build fallisce con "Cannot find module '@sveltejs/adapter-vercel'"

**Causa**: Adapter non installato

**Soluzione**:
```bash
npm install -D @sveltejs/adapter-vercel
git add package.json package-lock.json
git commit -m "Add Vercel adapter"
git push
```

### Problema: "CORS error" quando si connette al WebSocket

**Causa**: WebSocket URL non configurato correttamente

**Soluzione**:
1. Verifica `PUBLIC_WS_URL` in Vercel Environment Variables
2. Deve essere: `wss://api-8004-dev.fly.dev/ws` (con `wss://`, non `ws://`)

### Problema: Events caricati ma WebSocket non si connette

**Causa**: JWT token non valido per WebSocket

**Soluzione**:
- Il WebSocket richiede token JWT valido
- Verifica che login abbia successo (check console)
- Token potrebbe essere scaduto (dura 24h), ricarica pagina

---

## 📊 Monitoring

### Check Function Logs

```bash
# Vercel CLI
vercel logs --follow

# Oppure Dashboard
# Vercel → Your Project → Deployments → Latest → Function Logs
```

Cerca errori nei proxy endpoints:
- `api/activity/login`
- `api/activity/events`
- `api/activity/stats`

### Performance

Le Vercel Serverless Functions aggiungono ~50-100ms di latency rispetto a chiamate dirette, ma garantiscono sicurezza.

**Latency attesa**:
- Login: ~200-300ms
- Load events: ~150-250ms
- WebSocket: ~50-100ms (diretto, non passa per proxy)

---

## 🔐 Sicurezza Best Practices

### ✅ Do's

1. **Mai** usare `PUBLIC_*` per credenziali
2. **Sempre** usare HTTPS (Vercel lo fa automaticamente)
3. **Rotare** password API regolarmente
4. **Monitorare** logs per accessi sospetti
5. **Limitare** rate limiting a livello API

### ❌ Don'ts

1. **Mai** committare `.env` in Git (già in `.gitignore`)
2. **Mai** esporre `API_PASSWORD` nel client
3. **Mai** loggare credenziali in console
4. **Mai** condividere token JWT pubblicamente

---

## 🔄 Aggiornare Deployment

### Update Codice

```bash
git add .
git commit -m "Update activity feed"
git push
```

Vercel auto-deploya su ogni push.

### Update Environment Variables

1. Vercel Dashboard → Settings → Environment Variables
2. Edit o aggiungi variabile
3. **IMPORTANTE**: Dopo aver modificato env vars:
   - Settings → Deployments → Latest → "Redeploy"
   - Le env vars non si applicano automaticamente!

---

## 📈 Scaling

Vercel Serverless Functions scala automaticamente.

**Limiti Free Plan**:
- 100GB bandwidth/mese
- 100 function invocations/ora
- 10s max execution time

**Pro Plan** (se necessario):
- Unlimited bandwidth
- Unlimited invocations
- 60s max execution time

Per questa applicazione, Free Plan è sufficiente.

---

## 🆘 Support

**Problemi comuni risolti**:
- ✅ Credenziali sicure server-side
- ✅ CORS configurato
- ✅ WebSocket connection
- ✅ JWT token management
- ✅ Auto-reconnect logic

**Per ulteriori problemi**:
1. Check browser console
2. Check Vercel function logs
3. Test API endpoints direttamente
4. Verifica environment variables

---

**Last Updated**: 2025-01-06
**Vercel Adapter**: @sveltejs/adapter-vercel@latest
**Node Version**: 18.x (Vercel default)
