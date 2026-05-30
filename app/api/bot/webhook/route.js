import { NextResponse } from 'next/server';
import { getUser, saveUser } from '@/lib/bot-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to make Telegram API requests
async function sendTelegramRequest(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  } catch (e) {
    console.error(`Telegram API ${method} error:`, e);
    return null;
  }
}

// Generate the beautiful main menu template
function getMainMenuTemplate(user) {
  const riskLabels = {
    low: '🟢 Low Risk Only',
    medium: '🟡 Low & Medium Risk',
    high: '🔴 Degen Mode (All Risks)'
  };
  const riskLabel = riskLabels[user.risk] || '🟡 Low & Medium Risk';
  const sectorList = user.sectors.map(s => s.toUpperCase()).join(', ');

  const text = `📊 *POLLAPSE SafeFarm Alert Center* 🚨\n\nConfigure your custom prediction market LP filters to receive tailored, risk-adjusted yield alerts directly in this chat!\n\n🛠️ *Your Active Profile:*\n💰 *LP Budget:* $${user.budget.toLocaleString()} USD\n📂 *Farming Sectors:* ${sectorList}\n🛡️ *Risk Tolerance:* ${riskLabel}\n🔔 *Status:* ${user.active ? '🟢 ACTIVE (Sending Alerts)' : '🔴 PAUSED (Muted)'}\n\nSelect an option below to customize your filters:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '💰 Set LP Budget', callback_data: 'set_budget' },
        { text: '🛡️ Select Risk', callback_data: 'set_risk' }
      ],
      [
        { text: '📂 Filter Sectors', callback_data: 'set_sectors' },
        { text: user.active ? '⏸️ Pause Alerts' : '▶️ Resume Alerts', callback_data: 'toggle_status' }
      ]
    ]
  };

  return { text, reply_markup: keyboard };
}

// Send main menu
async function sendMainMenu(chatId, user) {
  const { text, reply_markup } = getMainMenuTemplate(user);
  await sendTelegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup
  });
}

// Edit existing message to main menu
async function editMainMenu(chatId, messageId, user) {
  const { text, reply_markup } = getMainMenuTemplate(user);
  await sendTelegramRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup
  });
}

// Send budget options menu
async function sendBudgetMenu(chatId, messageId, user) {
  const text = `💰 *Set Your LP Budget* 💰\n\nSelect your budget level. The SafeFarm engine automatically calculates your contract size share and ensures you qualify for the pool's strict minimum contract requirement.\n\n*Current budget:* $${user.budget.toLocaleString()} USD`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '$500', callback_data: 'budget_value_500' },
        { text: '$1,000', callback_data: 'budget_value_1000' }
      ],
      [
        { text: '$1,500 (Recommended)', callback_data: 'budget_value_1500' },
        { text: '$3,000', callback_data: 'budget_value_3000' }
      ],
      [
        { text: '$5,000', callback_data: 'budget_value_5000' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'menu_start' }
      ]
    ]
  };

  await sendTelegramRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// Send risk tolerance menu
async function sendRiskMenu(chatId, messageId, user) {
  const text = `🛡️ *Select Risk Tolerance Level* 🛡️\n\nSelect the risk profile for the prediction pools you want to farm. The engine filters pools based on liquidity cushion, resolution dates, and sector volatility.\n\n*Current risk:* ${user.risk.toUpperCase()}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🟢 Low Risk Only', callback_data: 'risk_value_low' }
      ],
      [
        { text: '🟡 Low & Medium (Recommended)', callback_data: 'risk_value_medium' }
      ],
      [
        { text: '🔴 Degen Mode (All Risks)', callback_data: 'risk_value_high' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'menu_start' }
      ]
    ]
  };

  await sendTelegramRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// Send sectors selection menu (with checkmarks)
async function sendSectorsMenu(chatId, messageId, user) {
  const text = `📂 *Filter Sectors* 📂\n\nChoose the market sectors you are interested in. Only events matching your checked categories will trigger notifications.\n\n*Selected:* ${user.sectors.map(s => s.toUpperCase()).join(', ')}`;

  const isSelected = (sec) => user.sectors.includes(sec) ? '✅' : '❌';

  const keyboard = {
    inline_keyboard: [
      [
        { text: `🏛️ Politics ${isSelected('politics')}`, callback_data: 'sector_toggle_politics' },
        { text: `₿ Crypto ${isSelected('crypto')}`, callback_data: 'sector_toggle_crypto' }
      ],
      [
        { text: `🌍 Geopolitics ${isSelected('geopolitics')}`, callback_data: 'sector_toggle_geopolitics' },
        { text: `📈 Economics ${isSelected('economics')}`, callback_data: 'sector_toggle_economics' }
      ],
      [
        { text: `🤖 Tech ${isSelected('tech')}`, callback_data: 'sector_toggle_tech' },
        { text: `⚽ Sports ${isSelected('sports')}`, callback_data: 'sector_toggle_sports' }
      ],
      [
        { text: `🌈 All Sectors ${isSelected('all')}`, callback_data: 'sector_toggle_all' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'menu_start' }
      ]
    ]
  };

  await sendTelegramRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// POST Webhook Ingestion
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Text command handler
    if (body.message && body.message.text) {
      const chat = body.message.chat;
      const text = body.message.text.trim();
      const username = body.message.from?.username || '';

      let user = getUser(chat.id);
      if (!user) {
        user = saveUser({ chatId: chat.id, username });
      }

      if (text.startsWith('/start') || text.startsWith('/menu')) {
        await sendMainMenu(chat.id, user);
      } else {
        // Reply with fallback instruction and main menu
        await sendTelegramRequest('sendMessage', {
          chat_id: chat.id,
          text: '🤖 *Pollapse Assistant* here! Click below to customize your live LP SafeFarm alert settings:',
          parse_mode: 'Markdown'
        });
        await sendMainMenu(chat.id, user);
      }
    }

    // 2. Inline button callback handler
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id;
      const messageId = cb.message.message_id;
      const data = cb.data;

      let user = getUser(chatId);
      if (!user) {
        user = saveUser({ chatId });
      }

      if (data === 'menu_start') {
        await editMainMenu(chatId, messageId, user);
      } 
      else if (data === 'set_budget') {
        await sendBudgetMenu(chatId, messageId, user);
      } 
      else if (data.startsWith('budget_value_')) {
        const val = parseInt(data.replace('budget_value_', ''));
        user.budget = val;
        saveUser(user);
        await sendTelegramRequest('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: `Budget updated to $${val.toLocaleString()}!`
        });
        await editMainMenu(chatId, messageId, user);
      } 
      else if (data === 'set_risk') {
        await sendRiskMenu(chatId, messageId, user);
      } 
      else if (data.startsWith('risk_value_')) {
        const val = data.replace('risk_value_', '');
        user.risk = val;
        saveUser(user);
        const riskLabels = { low: 'Low Risk', medium: 'Low & Medium', high: 'Degen (All)' };
        await sendTelegramRequest('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: `Risk set to: ${riskLabels[val]}`
        });
        await editMainMenu(chatId, messageId, user);
      } 
      else if (data === 'set_sectors') {
        await sendSectorsMenu(chatId, messageId, user);
      } 
      else if (data.startsWith('sector_toggle_')) {
        const sectorVal = data.replace('sector_toggle_', '');
        
        if (sectorVal === 'all') {
          user.sectors = ['all'];
        } else {
          let currentSectors = user.sectors.filter(s => s !== 'all');
          if (currentSectors.includes(sectorVal)) {
            currentSectors = currentSectors.filter(s => s !== sectorVal);
          } else {
            currentSectors.push(sectorVal);
          }
          if (currentSectors.length === 0) {
            currentSectors = ['all'];
          }
          user.sectors = currentSectors;
        }
        
        saveUser(user);
        await sendTelegramRequest('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: 'Sectors updated!'
        });
        await sendSectorsMenu(chatId, messageId, user);
      } 
      else if (data === 'toggle_status') {
        user.active = !user.active;
        saveUser(user);
        await sendTelegramRequest('answerCallbackQuery', {
          callback_query_id: cb.id,
          text: `Alerts ${user.active ? 'Activated' : 'Paused'}!`
        });
        await editMainMenu(chatId, messageId, user);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
