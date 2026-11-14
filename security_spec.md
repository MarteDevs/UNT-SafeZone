# Especificación de Seguridad Firestore — UNT SafeZone

## 1. Invariantes de Datos
1. **Default-Deny Global**: Ninguna colección no declarada explícitamente puede ser leída ni escrita.
2. **Integridad de Operador (`isAdmin`)**: Solo usuarios autenticados con correo verificado (`email_verified == true`) registrados en `/admins/{uid}` o el correo bootstrap autorizado pueden modificar `/campus_status`, `/zone_statuses`, publicar en `/incident_logs` o moderar `/field_reports`.
3. **Aislamiento de Reportes de Campo**: Un estudiante autenticado solo puede crear un reporte con `moderationStatus == 'pendiente'`, `isPublic == false`, `authorUid == request.auth.uid` y marcas temporales del servidor (`request.time`). Solo un operador puede cambiar `moderationStatus` e `isPublic`.
4. **Bitácora Inmutable**: Los registros en `/incident_logs/{logId}` no pueden editarse ni borrarse desde el cliente.
5. **Validación Estricta de Esquema**: Todo documento verifica tipos, longitudes máximas, enumeraciones cerradas y ausencia de campos fantasma (`keys().hasOnly(...)`).

## 2. Payloads Adversarios ("Dirty Dozen")
1. **Shadow Field en `campus_status`**: Enviar `isPublic: true` + campo extra `adminBypass: true` → Rechazado por `keys().hasOnly(...)`.
2. **Escalación de Privilegios en `admins`**: Intentar escribir `/admins/{uid}` desde un cliente autenticado → Rechazado (`allow write: if false`).
3. **Suplantación de `authorUid` en `field_reports`**: Usuario A envía `authorUid: "user_B"` → Rechazado por `incoming().authorUid == request.auth.uid`.
4. **Auto-aprobación de Reporte**: Estudiante crea reporte con `moderationStatus: "verificado"` o `isPublic: true` → Rechazado por regla de creación.
5. **Timestamp Falsificado**: Cliente envía `createdAt` distinto de `request.time` → Rechazado por `incoming().createdAt == request.time`.
6. **Email No Verificado**: Token con `email_verified: false` intentando crear reporte o simular correo admin → Rechazado por `request.auth.token.email_verified == true`.
7. **ID Poisoning**: `reportId` o `zoneId` con más de 128 caracteres o con `/` o espacios → Rechazado por `isValidId()`.
8. **Denial of Wallet String**: `advisoryMessage` de 50 KB en `campus_status` → Rechazado por `size() <= 280`.
9. **Alteración de Campos Inmutables**: Moderador intenta cambiar `description` o `authorUid` al moderar un reporte → Rechazado por `affectedKeys().hasOnly(['moderationStatus', 'isPublic', 'updatedAt'])`.
10. **Edición de Bitácora**: Usuario intenta `update` o `delete` sobre `/incident_logs/{logId}` → Rechazado (`allow update, delete: if false`).
11. **Consulta Masiva No Autorizada**: Cliente no autenticado intenta `list` sobre `field_reports` sin filtro `isPublic == true` → Rechazado por `allow list`.
12. **Tipo Inválido en Enum**: Enviar `alertLevel: "morado"` en `campus_status` → Rechazado por lista cerrada `['blanco', 'amarillo', 'naranja', 'rojo']`.
