require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Cambia si tu usuario cambia
const PERSONAL_TELEGRAM = 'fxesaubecerra';

const BROKER_LINK = 'https://broker.invidiatrade.com/register?referral=019d31a1-d1e2-7260-8a19-105d633941a5';

const state = new Map();

function setState(chatId, patch) {
  state.set(chatId, { ...(state.get(chatId) || {}), ...patch });
}

function getState(chatId) {
  return state.get(chatId) || {};
}

function loadLeads() {
  try {
    return JSON.parse(fs.readFileSync('./leads.json', 'utf8'));
  } catch {
    return [];
  }
}

function saveLead(lead) {
  const all = loadLeads();
  const item = { ...lead, ts: new Date().toISOString() };

  all.push(item);
  fs.writeFileSync('./leads.json', JSON.stringify(all, null, 2));

  const adminId = process.env.ADMIN_CHAT_ID;

  if (adminId) {
    const msg =
`📥 Nuevo lead / actualización

Usuario: ${lead.user || '-'}
Username: ${lead.username ? '@' + lead.username : 'sin username'}
Interés: ${lead.interest || '-'}
Etapa: ${lead.stage || '-'}
Email: ${lead.email || '-'}
Mensaje: ${lead.message || '-'}
Chat ID: ${lead.chatId || '-'}
Pantallazo: ${lead.screenshot ? 'Sí' : 'No'}
🕒 ${item.ts}`;

    bot.telegram.sendMessage(adminId, msg).catch(err => {
      console.error('Error enviando notificación:', err.message);
    });
  }
}

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('📊 Acceder a LatinPips Gratis', 'go_latinpips')],
  [Markup.button.callback('🧭 ADI 2.0 Indicador', 'go_adi')],
  [Markup.button.callback('🎓 Mentoría 1 a 1', 'go_mentoria')]
]);

// ================= START =================

bot.start(ctx => {
  setState(ctx.chat.id, { flow: 'start' });

  ctx.reply(
`👋 Si estás aquí, es porque estás buscando una forma más seria de mejorar tu trading.

Pero antes de continuar…

Necesito confirmar que eres una persona real y no un bot.

Toca el botón de abajo para continuar 👇`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirmar y continuar', 'confirm')]
    ])
  );
});

// ================= CONFIRMACIÓN =================

bot.action('confirm', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'Inicio',
    stage: 'confirmado'
  });

  ctx.editMessageText(
`Perfecto.

Te hago una pregunta rápida:

¿Estás operando actualmente, pero todavía no ves resultados consistentes?

¿Sientes que sabes lo suficiente para ganar, pero algo no está cuadrando?

La mayoría de traders no necesitan más ruido.

Necesitan estructura, reglas, acompañamiento y un entorno donde puedan operar con más claridad.

Eso es LatinPips.

Una comunidad gratuita para traders que quieren operar con señales, sesiones en vivo, análisis de mercado, herramientas algorítmicas y sistemas de trading automático.

Elige una opción:`,
    mainMenu
  );
});

// ================= LATINPIPS INTRO =================

bot.action('go_latinpips', ctx => {
  setState(ctx.chat.id, {
    flow: 'latinpips',
    step: null
  });

  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'LatinPips',
    stage: 'vio_intro_latinpips'
  });

  ctx.editMessageText(
`📊 LatinPips no es otro grupo más de trading.

Es un ecosistema creado para que operes con más estructura.

Dentro encuentras:

✅ Señales automatizadas
✅ Sesiones de Live Trading
✅ Análisis de mercado
✅ Grupo privado
✅ Recursos educativos
✅ Indicadores y herramientas de apoyo
✅ LatinPips IA: Trading algorítmico 100% en automático

Y algo importante:

No pagas membresía para entrar.

El acceso se habilita a través de nuestro broker aliado.

Tú operas con tu capital, desde tu cuenta, y nosotros podemos recibir una comisión del broker sin costo adicional para ti.

Así podemos mantener la comunidad gratuita sin cobrarte acceso.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📊 Ver beneficios por depósito', 'benefits')],
      [Markup.button.callback('💬 Tengo dudas', 'support')],
      [Markup.button.callback('⬅️ Volver', 'confirm')]
    ])
  );
});

// ================= BENEFICIOS =================

bot.action('benefits', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'LatinPips',
    stage: 'vio_beneficios'
  });

  ctx.editMessageText(
`📊 Beneficios de acceso a LatinPips

Tu ingreso es completamente GRATIS.

Lo único que cambia es el nivel de herramientas al que puedes acceder según el capital depositado en el broker aliado.

Esto existe por una razón simple:

Algunas estrategias, herramientas y sistemas automáticos no tienen sentido en cuentas demasiado pequeñas.

En LatinPips priorizamos algo:

👉 proteger tu capital y operar con estructura.

━━━━━━━━━━━━━━

📊 Desde $300 USD

• Señales automatizadas
• Sesiones en vivo
• Análisis de mercado
• Grupo privado
• Recursos educativos

━━━━━━━━━━━━━━

📈 Desde $500 USD

Todo lo anterior +
• Acceso a LatinPips IA 
• 2 semanas del Indicador Sentinel

━━━━━━━━━━━━━━

🚀 Desde $1000 USD

Todo lo anterior +
• 2 meses de Sentinel
• Plan de trading personalizado
• Estrategia para escalar tu cuenta

━━━━━━━━━━━━━━

La idea no es que deposites más.

La idea es que deposites lo correcto para operar con reglas, gestión de riesgo y un sistema claro.

Importante:
El trading implica riesgo. Puedes ganar, perder o tener semanas planas. No prometemos resultados fijos. Nuestro enfoque es estructura, proceso y control del riesgo.`,
    Markup.inlineKeyboard([
      [Markup.button.url('🔗 Registrarme en el broker', BROKER_LINK)],
      [Markup.button.callback('✅ Ya tengo cuenta y depósito listo', 'ready')],
      [Markup.button.callback('💬 Necesito ayuda', 'support')],
      [Markup.button.callback('⬅️ Volver', 'go_latinpips')]
    ])
  );
});

// ================= READY =================

bot.action('ready', ctx => {
  setState(ctx.chat.id, {
    flow: 'latinpips',
    step: 'email'
  });

  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'LatinPips',
    stage: 'inicio_verificacion'
  });

  ctx.editMessageText(
`Perfecto 🔥

Para verificar tu acceso a LatinPips, necesito dos cosas:

1. Tu correo electrónico
2. Un pantallazo del depósito o de tu cuenta fondeada

Primero envíame tu correo electrónico.`
  );
});

// ================= EMAIL / TEXT =================

bot.on('text', ctx => {
  const st = getState(ctx.chat.id);
  const text = ctx.message.text.trim();

  if (st.flow === 'latinpips' && st.step === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(text)) {
      return ctx.reply(
`Ese correo no parece válido.

Envíamelo en este formato:
nombre@email.com`
      );
    }

    setState(ctx.chat.id, {
      email: text,
      step: 'photo'
    });

    saveLead({
      chatId: ctx.chat.id,
      user: ctx.from.first_name,
      username: ctx.from.username,
      interest: 'LatinPips',
      stage: 'email_recibido',
      email: text
    });

    return ctx.reply(
`✅ Correo recibido.

Ahora envíame un pantallazo del depósito o de tu cuenta fondeada.

Cuando lo recibamos, el equipo revisará tu información para activar tu acceso.`
    );
  }

  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: st.flow || 'mensaje_general',
    stage: 'mensaje_usuario',
    message: text
  });

  ctx.reply(
`Para continuar, elige una opción:`,
    mainMenu
  );
});

// ================= PHOTO =================

bot.on('photo', ctx => {
  const st = getState(ctx.chat.id);

  if (st.flow === 'latinpips' && st.step === 'photo') {
    const fileId = ctx.message.photo.slice(-1)[0].file_id;

    saveLead({
      chatId: ctx.chat.id,
      user: ctx.from.first_name,
      username: ctx.from.username,
      interest: 'LatinPips',
      stage: 'verificacion_enviada',
      email: st.email,
      screenshot: fileId
    });

    setState(ctx.chat.id, {
      step: null,
      screenshot: fileId
    });

    ctx.reply(
`🔥 Perfecto.

Recibimos tu correo y tu pantallazo.

El equipo verificará tu depósito y te contactará para activar tu acceso a LatinPips.

Mientras tanto, recuerda:

El objetivo no es operar más.
El objetivo es operar mejor, con estructura y gestión de riesgo.`,
      mainMenu
    );

    const adminId = process.env.ADMIN_CHAT_ID;

    if (adminId) {
      bot.telegram.sendPhoto(adminId, fileId, {
        caption:
`📸 Pantallazo recibido para LatinPips

Usuario: ${ctx.from.first_name}
Username: ${ctx.from.username ? '@' + ctx.from.username : 'sin username'}
Email: ${st.email || '-'}
Chat ID: ${ctx.chat.id}`
      }).catch(err => {
        console.error('Error enviando pantallazo al admin:', err.message);
      });
    }

    return;
  }

  ctx.reply(
`Recibí una imagen.

Para verificar tu acceso a LatinPips, primero inicia el proceso desde el menú:`,
    mainMenu
  );
});

// ================= ADI =================

bot.action('go_adi', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'ADI 2.0 Indicador',
    stage: 'interes_adi'
  });

  ctx.editMessageText(
`🧭 ADI 2.0 Indicador

ADI 2.0 es nuestro indicador diseñado para ayudarte a leer el mercado con más claridad y operar con mayor estructura.

Si quieres información de precios, activación y disponibilidad, habla directamente conmigo.

👉 https://t.me/${PERSONAL_TELEGRAM}`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Hablar con Esaú', `https://t.me/${PERSONAL_TELEGRAM}`)],
      [Markup.button.callback('⬅️ Volver', 'confirm')]
    ])
  );
});

// ================= MENTORIA =================

bot.action('go_mentoria', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'Mentoría 1 a 1',
    stage: 'interes_mentoria'
  });

  ctx.editMessageText(
`🎓 Mentoría 1 a 1

Si quieres trabajar directamente conmigo para ordenar tu trading, mejorar tu ejecución y construir un proceso más serio, escríbeme aquí:

👉 https://t.me/${PERSONAL_TELEGRAM}

Esta opción es para traders que quieren acompañamiento personalizado, no solo información.`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Hablar con Esaú', `https://t.me/${PERSONAL_TELEGRAM}`)],
      [Markup.button.callback('⬅️ Volver', 'confirm')]
    ])
  );
});

// ================= SOPORTE =================

bot.action('support', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'Soporte',
    stage: 'solicito_soporte'
  });

  ctx.editMessageText(
`💬 Perfecto.

Si tienes dudas sobre el proceso, el broker, el depósito o el acceso a LatinPips, escríbeme directamente aquí:

👉 https://t.me/${PERSONAL_TELEGRAM}`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Hablar con soporte', `https://t.me/${PERSONAL_TELEGRAM}`)],
      [Markup.button.callback('⬅️ Volver', 'confirm')]
    ])
  );
});

// ================= LAUNCH =================

bot.launch().then(() => {
  console.log('Bot LatinPips optimizado activo 🚀');
});