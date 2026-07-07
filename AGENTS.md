# Instrucciones para Agentes y Desarrolladores

> [!IMPORTANT]
> **Buenas prácticas en Git y Desarrollo**:
> - Evita reescribir el historial de Git publicado (no uses `git push --force`, `git commit --amend` ni `git rebase` en commits que ya hayan sido subidos a la rama principal compartida), ya que esto puede desestabilizar entornos de integración y despliegue continuos.
> - Mantén siempre las ramas de integración principal en un estado funcional y compila localmente con `npm run build` antes de realizar despliegues.
> - Respeta las reglas de seguridad, RLS de Supabase y las integraciones del checkout de Flow y WhatsApp definidas en la documentación técnica.
