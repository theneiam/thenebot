import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/say (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = match[1];
  bot.sendMessage(chatId, response);
});
