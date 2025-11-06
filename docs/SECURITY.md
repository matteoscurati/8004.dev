# Security Architecture

Documentazione dell'architettura di sicurezza per l'Activity Feed API.

## Overview

L'integrazione dell'Activity Feed utilizza un **server-side proxy** per proteggere le credenziali API.

## Architettura

### Client-Side (Browser)
```
┌─────────────────────────────────┐
│  Browser (JavaScript)           │
│                                 │
│  ✓ JWT Token (in localStorage)  │
│  ✓ WebSocket connection         │
│  ✗ NO username/password         │
└─────────────────────────────────┘
          │
          │ HTTPS
          ▼
┌─────────────────────────────────┐
│  Vercel Edge (Server-Side)      │
│                                 │
│  ✓ API_USERNAME (env var)       │
│  ✓ API_PASSWORD (env var)       │
│  ✓ Proxy routes:                │
│    - POST /api/activity/login   │
│    - GET  /api/activity/events  │
│    - GET  /api/activity/stats   │
└─────────────────────────────────┘
          │
          │ HTTPS
          ▼
┌─────────────────────────────────┐
│  Activity API (Fly.io)          │
│                                 │
│  ✓ JWT authentication           │
│  ✓ Rate limiting                │
│  ✓ CORS configured              │
└─────────────────────────────────┘
```

## Security Features

### 1. Credential Protection 🔒

**Problema**: Le variabili `PUBLIC_*` in SvelteKit sono incluse nel bundle JavaScript client-side e visibili a tutti.

**Soluzione**:
- Le credenziali (`API_USERNAME`, `API_PASSWORD`) sono configurate come variabili **NON pubbliche** su Vercel
- Sono accessibili solo dalle Serverless Functions (server-side)
- Mai esposte al client

**Verifica**:
```bash
# ✅ Corretto: Non trovi nulla
curl https://your-site.vercel.app/_next/static/*.js | grep "API_PASSWORD"

# ❌ Problema: Se trovi la password, c'è una configurazione errata
```

### 2. JWT Token Management

**Flow**:
1. Client richiede: `POST /api/activity/login` (senza credenziali)
2. Server proxy usa credenziali sicure → Activity API
3. Activity API risponde con JWT token
4. Client salva token in `localStorage`
5. Client usa token per richieste successive

**Token Lifecycle**:
- **Durata**: 24 ore
- **Storage**: `localStorage` (accessibile solo al dominio)
- **Revoca**: Logout cancella token dal localStorage

### 3. WebSocket Security

**Problema**: WebSocket passa token come query parameter (visibile in logs)

**Mitigazione**:
- Token ha scadenza limitata (24h)
- Connection solo HTTPS/WSS
- Auto-reconnect se token scade

**Future Improvement**: Usare WebSocket subprotocols per passare token negli headers.

### 4. Server-Side Proxy Routes

Tre endpoint proxy sicuri:

#### `POST /api/activity/login`
```typescript
// Server-side only
const API_USERNAME = process.env.API_USERNAME; // ✅ Sicuro
const API_PASSWORD = process.env.API_PASSWORD; // ✅ Sicuro

// Forward to Activity API
fetch('https://api-8004-dev.fly.dev/login', {
  body: JSON.stringify({ username, password })
});
```

#### `GET /api/activity/events`
```typescript
// Forward with JWT from client
const authHeader = request.headers.get('Authorization');
fetch('https://api-8004-dev.fly.dev/events', {
  headers: { Authorization: authHeader }
});
```

#### `GET /api/activity/stats`
```typescript
// Same pattern as events
```

## Threat Model

### ✅ Protected Against

1. **Credential Exposure**
   - ✅ Credenziali mai nel bundle JavaScript
   - ✅ Credenziali mai nei logs client
   - ✅ Credenziali mai in DevTools

2. **Man-in-the-Middle (MITM)**
   - ✅ HTTPS obbligatorio (Vercel enforced)
   - ✅ WSS per WebSocket
   - ✅ No mixed content

3. **Token Theft**
   - ✅ Token con scadenza (24h)
   - ✅ HttpOnly localStorage (isolato per dominio)
   - ✅ No token in URL (eccetto WebSocket query param)

4. **Replay Attacks**
   - ✅ Token JWT con expiry
   - ✅ Server valida token signature

### ⚠️ Potential Risks

1. **XSS (Cross-Site Scripting)**
   - **Risk**: Se un attacker inietta script, può leggere `localStorage` e rubare token
   - **Mitigation**:
     - Svelte auto-escaping
     - CSP headers (da configurare)
     - Input validation

2. **Token in Logs**
   - **Risk**: WebSocket token visibile in server logs
   - **Mitigation**:
     - Token limitato a 24h
     - Monitoring logs per pattern sospetti

3. **Rate Limiting**
   - **Risk**: Abuso API senza rate limit client-side
   - **Mitigation**:
     - Rate limiting a livello API
     - Monitoring Vercel function invocations

## Best Practices

### Development

```bash
# .env (mai committare!)
API_USERNAME=admin
API_PASSWORD=dev_password_here
```

### Production (Vercel)

```bash
# Dashboard → Settings → Environment Variables
API_USERNAME=admin         # Production only
API_PASSWORD=strong_pwd    # Production only
```

### Code Review Checklist

- [ ] No `PUBLIC_` prefix per credenziali
- [ ] No hardcoded passwords/tokens
- [ ] No `console.log()` di credenziali
- [ ] HTTPS/WSS URLs (no HTTP/WS)
- [ ] Error messages non rivelano informazioni sensibili

## Compliance

### GDPR
- ✅ No PII (Personally Identifiable Information) nei logs
- ✅ Token revocabile (logout)
- ✅ Data minimization (solo eventi necessari)

### OWASP Top 10
- ✅ A01: Broken Access Control → JWT authentication
- ✅ A02: Cryptographic Failures → HTTPS/WSS
- ✅ A03: Injection → Input validation, Svelte escaping
- ✅ A07: Authentication Failures → Server-side auth

## Incident Response

### Token Compromesso

1. **Immediate**:
   - User fa logout (cancella token)
   - Token scade automaticamente in 24h

2. **Long-term**:
   - Rotare `API_PASSWORD` su Vercel
   - Invalidare tutti i token attivi (richiede API support)

### Credential Leak

1. **Immediate**:
   - Cambiare `API_PASSWORD` su Vercel e Fly.io API
   - Redeploy applicazione
   - Notificare utenti di fare logout/login

2. **Long-term**:
   - Audit codebase per altre esposizioni
   - Implementare secret scanning (GitHub)

### XSS Attack

1. **Immediate**:
   - Identify and patch vulnerability
   - Deploy fix
   - Rotare credenziali per sicurezza

2. **Long-term**:
   - Implementare CSP headers
   - Security audit code review

## Future Improvements

### Short-term
- [ ] CSP (Content Security Policy) headers
- [ ] Rate limiting client-side
- [ ] Token refresh mechanism

### Long-term
- [ ] HttpOnly cookies invece di localStorage
- [ ] Session management server-side
- [ ] 2FA per accesso admin API
- [ ] WebSocket subprotocols per token

## Audit Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-01-06 | Implementato server-side proxy | Proteggere credenziali API |
| 2025-01-06 | Migrato a Vercel adapter | Abilitare serverless functions |
| 2025-01-06 | Rimosso `PUBLIC_API_PASSWORD` | Credenziali esposte in bundle |

---

**Security Contact**: [Inserisci email/contatto]
**Last Review**: 2025-01-06
**Next Review**: 2025-04-06 (quarterly)
