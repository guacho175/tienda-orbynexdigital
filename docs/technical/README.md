# Índice de Documentación Técnica Modular

Esta sección de la documentación detalla la arquitectura, el diseño de datos, los flujos funcionales, la seguridad y los procedimientos operativos de la plataforma e-commerce de Orbynex Digital.

---

## 📂 Estructura Técnica de Guías

Haz click en cada enlace para acceder al documento técnico específico:

*   [**00 - Resumen Ejecutivo del Sistema**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/00-overview.md): Objetivos de negocio, alcance funcional (qué hace y qué no hace) y descripción general de dominios.
*   [**01 - Stack Tecnológico y Estructura de Carpetas**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/01-stack.md): Frameworks de desarrollo, dependencias de la interfaz de usuario, conectores a servicios externos y mapa físico del repositorio.
*   [**02 - Arquitectura del Sistema**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/02-architecture.md): Diagrama de arquitectura de componentes, flujo general de datos e interacción cliente/servidor.
*   [**03 - Modelo de Dominio y Base de Datos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/03-domain-model.md): Estructuras de tablas, tipos de datos, relaciones de llaves foráneas y diagrama ERD.
*   [**04 - Casos de Uso Principales**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/04-use-cases.md): Flujos principales y alternativos detallados para clientes y administradores.
*   [**05 - Integración y Flujo de Pagos Flow.cl**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/05-payment-flow.md): Funcionamiento criptográfico de firmas, webhook de confirmación, idempotencia de transacciones y estados.
*   [**06 - Gestión de Inventario y Reservas de Stock**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/06-inventory-reservations.md): Diferenciación entre stock físico y stock vendible, ventana de reserva de 10 minutos y mitigación de condiciones de carrera.
*   [**07 - Seguridad y Políticas de Acceso en Supabase**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/07-supabase-security.md): Políticas RLS, grants y restricción de ejecución en RPCs transaccionales con `SECURITY DEFINER`.
*   [**08 - Referencia de la API Serverless**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/08-api-reference.md): Contratos de entrada y salida HTTP de los endpoints serverless de Vercel bajo `api/`.
*   [**09 - Componentes del Frontend y Flujo de Interfaz**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/09-frontend-components.md): Organización de rutas, componentes visuales clave (ProductCard, CartDrawer, ProductForm) y manejo del estado global del carrito.
*   [**10 - Guía de Instalación y Desarrollo Local**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/10-installation.md): Requisitos de desarrollo, comandos útiles, configuración de variables de entorno y túnel ngrok para pruebas locales de sandbox de Flow.
*   [**11 - Guía de Despliegue en Producción**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/11-deployment.md): Pasos de configuración en Vercel, Supabase y Flow comercial, checklist de lanzamiento y monitoreo de logs.
*   [**12 - Flujo de Trabajo para Futuros Agentes de IA**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/12-agent-workflow.md): Instrucciones operativas e inquebrantables para el mantenimiento automatizado de código.
*   [**13 - Listas de Verificación y Mantenimiento**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/13-maintenance-checklists.md): Listas de control rápidas para asegurar la calidad de modificaciones.
*   [**14 - Riesgos Conocidos y Deuda Técnica**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/14-known-risks.md): Lista de limitaciones conocidas y propuestas de mejora futuras.
*   [**15 - Glosario de Términos**](file:///C:/Users/galin/OneDrive/Documentos/tienda-orbynexdigital/docs/technical/15-glossary.md): Definiciones semánticas de conceptos clave de negocio y código.
