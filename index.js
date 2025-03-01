const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

// بوت التتبع المالي الآمن
const BOT_TOKEN = '7960387470:AAF-o-KID5SmxigdsFyFeELtBK0ghGnYQVY';

// ... [Keep the rest of the previous code exactly as provided] ...

// Serverless deployment
module.exports = bot.webhookCallback();

// Local testing (if needed)
if (process.env.NODE_ENV === 'development') {
  bot.launch();
  console.log('Bot running locally');
}
// Language configuration
const messages = {
  en: {
    welcome: '💰 Welcome to Budget Bot!\n\nCommands:\n/addincome [amount] [category]\n/addexpense [amount] [category]\n/summary\n/report [daily/weekly/monthly]\n/setbudget [category] [amount]\n/export\n/help\n/lang',
    added: (type, amount, category) => `✅ Added ${type} of ${amount} in ${category}`,
    balance: (income, expense, balance) => `📊 Balance:\nIncome: ${income}\nExpenses: ${expense}\nBalance: ${balance}`,
    invalidAmount: '❌ Invalid amount format. Use numbers only.',
    budgetSet: (category, amount) => `📌 Budget set for ${category}: ${amount}`,
  },
  ar: {
    welcome: '💰 مرحبًا في بوت الميزانية!\n\nالأوامر:\n/addincome [المبلغ] [الفئة]\n/addexpense [المبلغ] [الفئة]\n/summary\n/report [يومي/أسبوعي/شهري]\n/setbudget [الفئة] [المبلغ]\n/export\n/help\n/lang',
    added: (type, amount, category) => `✅ تم إضافة ${type} بقيمة ${amount} في ${category}`,
    balance: (income, expense, balance) => `📊 الرصيد:\nالإيرادات: ${income}\nالمصروفات: ${expense}\nالرصيد: ${balance}`,
    invalidAmount: '❌ تنسيق المبلغ غير صحيح. استخدم أرقامًا فقط.',
    budgetSet: (category, amount) => `📌 تم تحديد ميزانية لـ ${category}: ${amount}`,
  }
};

// Simple JSON storage
const dataPath = path.join(__dirname, 'data.json');
let db = { users: {} };

try {
  db = JSON.parse(fs.readFileSync(dataPath));
} catch (err) {
  fs.writeFileSync(dataPath, JSON.stringify(db));
}

const saveData = () => fs.writeFileSync(dataPath, JSON.stringify(db));

const bot = new Telegraf(process.env.BOT_TOKEN);

// Set user language preference
const getUserLang = (ctx) => db.users[ctx.from.id]?.lang || 'en';

// Command handlers
bot.start((ctx) => {
  const lang = getUserLang(ctx);
  ctx.reply(messages[lang].welcome);
});

bot.command('addincome', (ctx) => handleTransaction(ctx, 'income'));
bot.command('addexpense', (ctx) => handleTransaction(ctx, 'expense'));

bot.command('summary', (ctx) => {
  const userId = ctx.from.id;
  const lang = getUserLang(ctx);
  const user = db.users[userId] || { transactions: [] };
  
  const summary = user.transactions.reduce((acc, t) => {
    acc[t.type] += t.amount;
    acc.balance = acc.income - acc.expense;
    return acc;
  }, { income: 0, expense: 0, balance: 0 });

  ctx.reply(messages[lang].balance(summary.income, summary.expense, summary.balance));
});

bot.command('setbudget', (ctx) => {
  const [,, category, amount] = ctx.message.text.split(' ');
  const userId = ctx.from.id;
  const lang = getUserLang(ctx);

  if (!category || !amount || isNaN(amount)) {
    return ctx.reply(messages[lang].invalidAmount);
  }

  db.users[userId] = db.users[userId] || { transactions: [], budgets: {} };
  db.users[userId].budgets[category] = parseFloat(amount);
  saveData();
  ctx.reply(messages[lang].budgetSet(category, amount));
});

// Add other command handlers...

// Helper functions
function handleTransaction(ctx, type) {
  const [,, amount, category] = ctx.message.text.split(' ');
  const userId = ctx.from.id;
  const lang = getUserLang(ctx);

  if (!amount || isNaN(amount)) {
    return ctx.reply(messages[lang].invalidAmount);
  }

  db.users[userId] = db.users[userId] || { transactions: [], budgets: {} };
  db.users[userId].transactions.push({
    type,
    amount: parseFloat(amount),
    category,
    date: new Date().toISOString()
  });
  
  saveData();
  ctx.reply(messages[lang].added(type, amount, category));
}

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Serverless deployment
module.exports = bot.webhookCallback();

// For local testing (if needed)
if (process.env.NODE_ENV === 'development') {
  bot.launch();
}
