import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

mongoose.connect(process.env.MONGODB_URI);

const PromoSchema = new mongoose.Schema(
  {
    code: String,
    used: Boolean,
    usedBy: String,
    tabTeam: String,
    accessTime: String
  },
  { collection: "promo" }
);
const Promo = mongoose.model("promo", PromoSchema);
const MAX_PROMO_QTY = 5;

/**
 * Get promo codes command
 */
bot.onText(/\/promo (\d+)(?:\s+(\d{1,2}))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const ipId = match[1];
  const qty = Number(match[2] || 1);

  if (qty > MAX_PROMO_QTY) {
    bot.sendMessage(
      chatId,
      `Вы запросили ${qty} промо-кодов! К сожалению, максимальное количество промо-кодов на один ID - 5 штук`
    );
  } else {
    Promo.count({ used: true, usedBy: ipId }).exec((err, usedPromoCount) => {
      let usedLimit = usedPromoCount + qty;

      if (usedLimit > MAX_PROMO_QTY) {
        usedLimit = MAX_PROMO_QTY;
      }

      if (usedPromoCount + qty > MAX_PROMO_QTY) {
        bot.sendMessage(
          chatId,
          `К сожалению, максимальное количество промо-кодов на один ID - 5 штук. Вы использовали ${usedPromoCount}`
        );
      } else {
        bot.sendMessage(
          chatId,
          `Ваш ID ${ipId} и вы запросили ${qty} промо-кодов (использовано ${usedLimit} из 5)`
        );
        Promo.find({ used: false })
          .limit(qty)
          .exec((err, response) => {
            if (!response || !response.length) {
              bot.sendMessage(
                msg.chat.id,
                `К сожалению больше не осталось промо-кодов :(`
              );
            }

            const promos = response.map(item => item.code).join("\n");
            bot.sendMessage(chatId, promos);

            // mark codes as used
            response.map(item => {
              Promo.update(
                { _id: item._id },
                { $set: { used: true, usedBy: ipId } }
              ).exec();
            });
          });
      }
    });
  }
});

bot.onText(/\/unused/, msg => {
  Promo.count({ used: false }).exec((err, response) => {
    bot.sendMessage(
      msg.chat.id,
      `Осталось ${response} неиспользованных промо-кодов`
    );
  });
});

bot.onText(/\/unuseall/, msg => {
  Promo.updateMany({}, { $set: { used: false, usedBy: null } }).exec(
    (err, response) => {
      bot.sendMessage(
        msg.chat.id,
        `Статус used для всех промо-кодов установлен в false`
      );
    }
  );
});

bot.onText(/\/help/, msg => {
  const usageMsg = [
    "Для получиния промо-кода введите команду",
    "/promo ID_НЕЗВИСИМОГО_ПАРТНЕРА_HERBALIFE КОЛИЧЕСТВО_ПРОМОКОДОВ",
    "Например /promo 1122334455 3",
    "Максимальное количество промо-кодов на один ID - 5"
  ];
  bot.sendMessage(msg.chat.id, usageMsg.join("\n"));
});
