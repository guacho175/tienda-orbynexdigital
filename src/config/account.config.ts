export const accountConfig = {
  routes: {
    auth: "/auth",
    account: "/cuenta",
    admin: "/admin",
  },
  auth: {
    pageTitle: "Cuenta",
    title: "Ingresa a tu cuenta",
    subtitle: "Inicia sesion o crea una cuenta para revisar tus pedidos.",
    emailLabel: "Email",
    passwordLabel: "Contrasena",
    submitLabels: {
      signin: "Ingresar",
      signup: "Crear cuenta",
      loading: "Procesando...",
    },
    toggleLabels: {
      signin: "No tienes cuenta? Crear cuenta",
      signup: "Ya tienes cuenta? Iniciar sesion",
    },
    toasts: {
      signinSuccess: "Bienvenido",
      signupSuccess: "Cuenta creada",
      signupConfirmation: "Revisa tu correo y confirma el registro para activar tu cuenta.",
      fallbackError: "Error de autenticacion",
    },
    environmentSafety: {
      localRemoteSignupBlocked:
        "Registro bloqueado en local: este entorno esta conectado a un Supabase remoto. Usa el dominio publico configurado o habilita explicitamente VITE_ALLOW_REMOTE_AUTH_SIGNUP_FROM_LOCAL=true.",
      localRemoteSignupNotice:
        "Este entorno local usa una base remota. Para evitar usuarios reales de prueba, el registro esta bloqueado aqui.",
    },
  },
  navigation: {
    accountLabel: "Cuenta",
    accountAriaLabel: "Ir a mi cuenta",
  },
  dashboard: {
    title: "Mi cuenta",
    subtitle: "Revisa tus pedidos asociados a este correo.",
    menu: {
      profile: "Mi perfil",
      orders: "Pedidos",
      signOut: "Cerrar sesion",
    },
    profile: {
      title: "Datos de la cuenta",
      emailLabel: "Correo",
      emailConfirmed: "Correo confirmado",
      emailPending: "Correo pendiente de confirmacion",
      roleNote:
        "Esta cuenta se usa para consultar pedidos. Los permisos especiales se asignan por rol interno.",
    },
    unconfirmedTitle: "Confirma tu correo",
    unconfirmedDescription:
      "Para cargar compras hechas como invitado, primero confirma el correo enviado al registrarte.",
    emptyTitle: "Todavia no tienes pedidos asociados",
    emptyDescription:
      "Puedes comprar como invitado o iniciar sesion antes de pagar para guardar el pedido en tu cuenta.",
    browseProducts: "Ver productos",
    retry: "Reintentar",
    loadingOrders: "Cargando pedidos...",
    fallbackLoadError: "No se pudieron cargar tus pedidos.",
    linkWarning:
      "No pudimos actualizar compras invitadas en este momento. Tus pedidos ya asociados se muestran igual.",
    orderLabel: "Pedido",
    createdAtLabel: "Creado",
    paidAtLabel: "Pagado",
    statusLabel: "Estado",
    totalLabel: "Total",
    itemsLabel: "Productos",
    statusLabels: {
      pending: "Pendiente",
      redirected: "Pago iniciado",
      paid: "Pagado",
      failed: "Fallido",
      cancelled: "Cancelado",
      expired: "Expirado",
      reservation_expired: "Reserva expirada",
      stock_conflict: "Revision de stock",
      requires_manual_review: "Revision manual",
    },
  },
} as const;

export type AccountConfig = typeof accountConfig;
