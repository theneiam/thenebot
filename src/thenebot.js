import TelegramBot from "node-telegram-bot-api";

const TOKEN = "562767198:AAEHVXKxi-k44O1Lqm6nZeqQaJTpxxGlJtE";
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/say (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = match[1];
  bot.sendMessage(chatId, response);
});
