# 📋 Tareas Pendientes - Phase 4: Monetization & Analytics

> **Última actualización**: 18 de Enero, 2026  
> **Estado**: Infraestructura creada, pendiente integración y configuración

---

## 🔴 Configuración Crítica (Hacer Primero)

### 1. Ejecutar Migraciones SQL
```bash
# En Supabase Dashboard → SQL Editor
# Ejecutar: supabase/migrations/phase4_monetization.sql
```
- [ ] Crear tipos ENUM (`subscription_tier`, `subscription_status`)
- [ ] Crear tabla `plan_limits`
- [ ] Agregar columnas a `profiles` (tier, usage, etc.)
- [ ] Crear función `check_usage_limit`
- [ ] Crear trigger `on_task_created`
- [ ] Grandfathering: `UPDATE profiles SET is_legacy = TRUE WHERE created_at < NOW();`

### 2. Configurar RevenueCat
- [ ] Crear cuenta en [app.revenuecat.com](https://app.revenuecat.com)
- [ ] Crear productos:
  - `bitrova_pro_monthly` ($4.99)
  - `bitrova_pro_yearly` ($49.99)
  - `bitrova_enterprise_monthly` ($14.99)
  - `bitrova_enterprise_yearly` ($149.99)
- [ ] Copiar API keys y actualizar en `services/subscriptionService.js`:
```javascript
const REVENUECAT_API_KEY_IOS = 'appl_XXXXX';
const REVENUECAT_API_KEY_ANDROID = 'goog_XXXXX';
```

### 3. Configurar Secretos de Supabase
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FROM_EMAIL="Bitrova <noreply@tudominio.com>"
```

### 4. Desplegar Edge Functions
```bash
supabase functions deploy analyze-task
supabase functions deploy send-weekly-report
```

---

## 🟡 Integración en Pantallas Existentes

### Settings Screen (`app/settings.js`)
- [ ] Importar `QuotaSummaryCard` de `components/QuotaIndicator.js`
- [ ] Agregar sección "Plan & Usage" con el card de quotas
- [ ] Agregar botón "Upgrade to Pro" que abre `PaywallModal`
- [ ] Agregar toggle "Weekly Email Reports" (solo Pro/Enterprise)
- [ ] Agregar selector de día para reportes semanales

### Add Task Modal (`app/add-task.js`)
- [ ] Importar `SmartDueDateSuggestion`
- [ ] Agregar debajo del input de título
- [ ] Conectar `onAccept` para auto-fill priority y dueDate
- [ ] Verificar acceso con `useFeatureAccess`

### Task Details (`app/task-details.js`)
- [ ] Integrar `SmartDueDateSuggestion` en edición de fecha
- [ ] Mostrar badge "AI" si la prioridad fue sugerida

### Home Screen (`app/index.js`)
- [ ] Agregar botón "AI Prioritize" en el header (solo Pro)
- [ ] Importar `prioritizeTasks` de `aiService`
- [ ] Agregar link a Analytics en el menú

### Cloud Backup (`app/cloud-backup.js`)
- [ ] Verificar acceso con `useFeatureAccess('cloud_sync')`
- [ ] Mostrar `PaywallModal` si no tiene acceso

### Recurring Tasks
- [ ] Gate `createRecurringTask` con verificación de tier
- [ ] Mostrar paywall si usuario Free intenta crear recurring

---

## 🟢 Componentes Adicionales (Opcional)

### AIPriorityBadge Component
- [ ] Crear `components/AIPriorityBadge.js`
- [ ] Mostrar score de confianza del AI
- [ ] Tooltip con reasoning

### Quota Warnings
- [ ] Agregar toast/alert al 80% del límite
- [ ] Bloquear creación de tareas al 100%
- [ ] Mostrar banner de upgrade

### Export Analytics
- [ ] Agregar botón "Export CSV" en analytics
- [ ] Agregar botón "Export PDF" (opcional)

---

## 🔵 Testing & QA

### Flujo de Suscripción
- [ ] Test compra en sandbox (iOS TestFlight)
- [ ] Test restore purchases
- [ ] Verificar sync con Supabase después de compra

### Flujo de Quotas
- [ ] Crear 25 tareas como Free user
- [ ] Verificar que se bloquea la tarea 26
- [ ] Verificar que el upgrade desbloquea

### AI Features
- [ ] Probar analyze-task Edge Function
- [ ] Verificar respuestas de OpenAI
- [ ] Test fallback cuando API falla

### Weekly Reports
- [ ] Enviar reporte de prueba manualmente
- [ ] Verificar formato de email
- [ ] Probar con Resend sandbox

---

## 📁 Archivos Creados (Ya completados)

| Archivo | Estado |
|---------|--------|
| `constants/tiers.js` | ✅ |
| `services/subscriptionService.js` | ✅ |
| `services/quotaService.js` | ✅ |
| `services/aiService.js` | ✅ |
| `context/SubscriptionContext.js` | ✅ |
| `hooks/useFeatureAccess.js` | ✅ |
| `components/PaywallModal.js` | ✅ |
| `components/QuotaIndicator.js` | ✅ |
| `components/SmartDueDateSuggestion.js` | ✅ |
| `components/analytics/ProductivityChart.js` | ✅ |
| `components/analytics/CategoryBreakdown.js` | ✅ |
| `app/analytics.js` | ✅ |
| `supabase/functions/analyze-task/index.ts` | ✅ |
| `supabase/functions/send-weekly-report/index.ts` | ✅ |
| `supabase/migrations/phase4_monetization.sql` | ✅ |

---

## 📝 Notas

- **Grandfathering**: Ejecutar DESPUÉS de migrar para marcar usuarios existentes como Legacy
- **CRON Job**: Configurar en Supabase para weekly reports (Lunes 9 AM UTC)
- **RevenueCat Web**: No soportado, purchases solo en mobile

---

**¡Buena suerte mañana! 🚀**
