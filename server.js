require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const { google } = require('googleapis');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);

const BROKER_LINK = 'https://broker.invidiatrade.com/register?referral=019d31a1-d1e2-7260-8a19-105d633941a5';
const RESULTS_LINK = 'https://latinpips.com';
const SUPPORT_LINK = 'https://wa.me/523344407253';
const GROUP_LINK = 'https://t.me/+Tkqb2dWntl5lNjUx';

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

async function saveLeadToGoogleSheets(lead) {
  try {
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Google Sheets no configurado');
      return;
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          lead.user || '',
          lead.username ? '@' + lead.username : '',
          lead.chatId || '',
          lead.stage || '',
          lead.email || '',
          lead.message || '',
          lead.screenshot || '',
          'Pendiente'
        ]]
      }
    });

    console.log('Lead guardado en Google Sheets ✅');
  } catch (err) {
    console.error('Error guardando en Google Sheets:', err.message);
  }
}

function saveLead(lead) {
  const all = loadLeads();
  const item = { ...lead, ts: new Date().toISOString() };

  all.push(item);
  fs.writeFileSync('./leads.json', JSON.stringify(all, null, 2));

  const importantStages = [
    'verificacion_enviada',
    'solicito_soporte'
  ];

  if (importantStages.includes(item.stage)) {
    saveLeadToGoogleSheets(item);
  }

  const adminId = process.env.ADMIN_CHAT_ID;

  if (adminId && importantStages.includes(item.stage)) {
    let msg = '';

    if (item.stage === 'verificacion_enviada') {
      msg =
`📸 Nueva solicitud de acceso LatinPips

👤 Usuario: ${item.user || '-'}
🔗 Username: ${item.username ? '@' + item.username : 'sin username'}
📧 Email: ${item.email || '-'}
🆔 Chat ID: ${item.chatId || '-'}
📌 Estado: Pendiente validación`;
    }

    if (item.stage === 'solicito_soporte') {
      msg =
`💬 Nueva solicitud de soporte

👤 Usuario: ${item.user || '-'}
🔗 Username: ${item.username ? '@' + item.username : 'sin username'}
📝 Mensaje: ${item.message || '-'}
🆔 Chat ID: ${item.chatId || '-'}`;
    }

    if (msg) {
      bot.telegram.sendMessage(adminId, msg).catch(err => {
        console.error('Error enviando notificación:', err.message);
      });
    }
  }
}

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    try {
      await ctx.answerCbQuery();
    } catch (err) {
      console.error('Error respondiendo botón:', err.message);
    }
  }
  return next();
});

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🚀 Quiero acceder a mi beca', 'benefits')],
  [Markup.button.url('📊 Ver resultados reales', RESULTS_LINK)],
  [Markup.button.callback('💬 Soporte', 'support')]
]);

bot.start(ctx => {
  setState(ctx.chat.id, { flow: 'start', step: null });

  ctx.reply(
`👋 Si estás aquí, es porque quieres empezar a generar resultados reales con el trading.

Antes de continuar, necesito confirmar que eres una persona real y no un bot.

Toca el botón de abajo para continuar 👇`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirmar y continuar', 'confirm')]
    ])
  );
});

bot.action('confirm', async ctx => {
  try {
    saveLead({
      chatId: ctx.chat.id,
      user: ctx.from.first_name,
      username: ctx.from.username,
      interest: 'Inicio',
      stage: 'confirmado'
    });

    await ctx.editMessageText(
`Perfecto. Bienvenido a LatinPips.

Te cuento rápido cómo funciona.

LatinPips es un ecosistema de trading donde puedes acceder a:

✅ Señales diarias de Oro, Bitcoin y Forex
✅ Sesiones de trading en vivo
✅ Clases semanales
✅ Comunidad privada
✅ Indicadores
✅ Trading automático con LatinPips IA

Lo mejor de todo:

No pagas una membresía.
No compras un curso.
No pagas una suscripción mensual.

Tu acceso a LatinPips es completamente gratuito gracias a nuestro broker aliado, quien otorga becas de acceso a nuestra comunidad.

Tú operas con tu capital desde tu propia cuenta, y nosotros podemos recibir una comisión del broker sin costo adicional para ti.

Para iniciar solo necesitas 3 pasos:

1. Crear y verificar tu cuenta
2. Depositar
3. Enviar tu correo y pantallazo para validar acceso`,
      mainMenu
    );
  } catch (err) {
    console.error('Error en confirm:', err.message);
    await ctx.reply('Hubo un problema cargando el menú. Intenta escribir /start nuevamente.');
  }
});

bot.action('benefits', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'LatinPips',
    stage: 'vio_beneficios'
  });

  ctx.editMessageText(
`🚀 Accede a LatinPips

ACCESO NIVEL 1
Desde $300 USD

• Señales automatizadas
• Sesiones en vivo
• Grupo privado
• Recursos educativos

━━━━━━━━━━━━━━

ACCESO NIVEL 2
Desde $500 USD

Todo lo anterior +
• Trading automático con LatinPips IA
• 2 semanas del indicador Sentinel

━━━━━━━━━━━━━━

ACCESO NIVEL 3
Desde $1000 USD

Todo lo anterior +
• 2 meses de Sentinel
• Plan de trading personalizado
• Estrategia para escalar tu cuenta`,
    Markup.inlineKeyboard([
      [Markup.button.url('🔗 Registrarme en el broker aliado', BROKER_LINK)],
      [Markup.button.callback('✅ Ya tengo cuenta y depósito listo', 'ready')],
      [Markup.button.url('📊 Ver resultados reales', RESULTS_LINK)],
      [Markup.button.callback('💬 Soporte', 'support')],
      [Markup.button.callback('⬅️ Volver', 'confirm')]
    ])
  );
});

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

Para validar tu acceso necesito:

1. Tu correo electrónico
2. Un pantallazo del depósito o cuenta fondeada

Primero envíame tu correo electrónico.`
  );
});

bot.action('support', ctx => {
  saveLead({
    chatId: ctx.chat.id,
    user: ctx.from.first_name,
    username: ctx.from.username,
    interest: 'Soporte',
    stage: 'solicito_soporte',
    message: 'Solicitó soporte desde el bot'
  });

  ctx.editMessageText(
`💬 Perfecto.

Si tienes dudas sobre el proceso, el broker, el depósito o el acceso a LatinPips, escríbenos por WhatsApp:

${SUPPORT_LINK}`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Abrir WhatsApp de soporte', SUPPORT_LINK)],
      [Markup.button.callback('⬅️ Volver', 'confirm')]
    ])
  );
});

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

Ahora envíame el pantallazo del depósito o cuenta fondeada.`
    );
  }

  ctx.reply(
`Para continuar, elige una opción:`,
    mainMenu
  );
});

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

Recibimos tu información correctamente.

Puedes solicitar acceso desde ahora a nuestra comunidad privada:

${GROUP_LINK}

Nuestro equipo verificará tu registro y depósito.

Si todo está correcto, tu solicitud será aprobada dentro de las próximas 24 horas y tendrás acceso completo a los servicios correspondientes a tu nivel.`,
      mainMenu
    );

    const adminId = process.env.ADMIN_CHAT_ID;

    if (adminId) {
      bot.telegram.sendPhoto(adminId, fileId, {
        caption:
`📸 Pantallazo recibido para LatinPips

Usuario: ${ctx.from.first_name || '-'}
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

Para validar tu acceso a LatinPips, primero inicia el proceso desde el menú:`,
    mainMenu
  );
});

const app = express();

app.get('/', (req, res) => {
  res.send('Bot LatinPips activo 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor web activo en puerto ${PORT}`);
});

bot.launch().then(() => {
  console.log('Bot LatinPips premium activo 🚀');
});