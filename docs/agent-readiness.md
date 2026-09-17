# Preparación para agentes

La negociación `Accept: text/markdown` depende del Worker de Nitro. Un deploy puramente
estático sirve HTML antes de ejecutar el middleware y rompe esa capacidad.

## Cloudflare Pages

Configurar el proyecto con estos valores:

- **Build command:** `pnpm build`
- **Build output directory:** `dist`
- **Versión de Node:** una versión LTS compatible con el `packageManager` del repositorio
- **Root directory:** la raíz del repositorio

Después del build, comprobar que existan:

```bash
test -d dist/_worker.js
test -f dist/_worker.js/index.js
test -f dist/_routes.json
```

No usar `pnpm generate` para el deploy: ese comando genera una salida estática que no
puede negociar representaciones.

Para probar localmente el mismo artefacto:

```bash
pnpm build
pnpm dlx wrangler@latest pages dev dist --port 3000
pnpm verify:agent-readiness -- --base-url http://127.0.0.1:3000
```

Después de cada deploy:

```bash
pnpm verify:agent-readiness -- --base-url https://comparatasas.ar
```

## WAF y bots

Las reglas viven en Cloudflare y no están versionadas en este repositorio.

1. Crear una regla WAF de tipo **Skip** para tráfico verificado por Cloudflare usando
   `cf.client.bot`. Limitar el skip a las protecciones que realmente interfieran con
   lectura pública; no omitir controles de seguridad de APIs o administración.
2. No permitir ni bloquear tráfico sólo por `User-Agent`: el encabezado se falsifica con
   facilidad. La lista de `robots.txt` expresa intención de rastreo, no identidad.
3. Revisar **Bot Fight Mode / Super Bot Fight Mode** y sus eventos. Si bloquea crawlers
   legítimos, ajustar la configuración con señales de bots verificados y reglas de
   alcance concretas.
4. Aplicar rate limiting al tráfico no verificado por IP, ruta y volumen. Excluir
   `cf.client.bot` únicamente cuando Cloudflare haya verificado el bot.
5. Tras cambiar reglas, ejecutar el verificador contra producción. Comprueba
   `ChatGPT-User`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`,
   `DeepSeekBot` y `ora-agent`; que una petición funcione no demuestra por sí sola que
   su identidad sea auténtica.

## Caché y `Accept`

Las rutas `/`, `/about`, `/contact`, `/privacy`, `/metodologia` y `/sumarse` pueden
responder HTML o Markdown. La respuesta incluye `Vary: Accept`, pero una regla de caché
de Cloudflare debe respetar esa variación.

La opción más segura es excluir esas seis rutas de **Cache Rules**. Si se habilita caché,
configurar una clave que incluya el encabezado `Accept` y verificar por separado:

```bash
curl -I -H 'Accept: text/html' https://comparatasas.ar/about
curl -I -H 'Accept: text/markdown' https://comparatasas.ar/about
```

Nunca usar una única entrada de caché para ambas representaciones.

## Pendientes externos

- Aplicar y revisar la configuración anterior en la cuenta de Cloudflare Pages.
- Ejecutar el smoke test después de un deploy nuevo; el estado actual de producción sólo
  sirve como baseline.
- Trabajar el posicionamiento de marca fuera del código: consistencia de nombre, dirección
  y contacto (NAP cuando corresponda), menciones, enlaces y perfiles canónicos.

Estos cambios técnicos mejoran descubrimiento y recuperación para agentes, pero no
garantizan por sí solos una mejora del ranking de marca.
