// Telegram bridge — sends the TikTok + Pinterest copy to a Telegram chat
// so you can manually post on platforms that aren't auto-publishing yet.
//
// Secrets:
//   TELEGRAM_BOT_TOKEN   — from @BotFather
//   TELEGRAM_CHAT_ID     — your personal chat id (start a chat with the bot, then
//                          curl https://api.telegram.org/bot<TOKEN>/getUpdates → message.chat.id)

export async function publish(env, { copy, media, productUrl, type, allCopy }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) throw new Error('Telegram creds missing');

  // We send the TikTok + Pinterest copy bundled, so you have one message to copy from per post.
  const tt = (allCopy && allCopy.tiktok) || copy || {};
  const pin = (allCopy && allCopy.pinterest) || {};

  const imageUrl = media?.imageUrl || media?.thumbnailUrl;

  const ttCaption = (tt.caption || '').trim();
  const ttHashtags = (tt.hashtags || []).join(' ');
  const pinTitle = (pin.title || '').trim();
  const pinDescription = (pin.description || '').trim();

  const parts = [
    '*📱 TikTok*',
    ttCaption,
    ttHashtags,
    '',
    '*📌 Pinterest*',
    '*Title:* ' + (pinTitle || '(none)'),
    '*Description:* ' + (pinDescription || '(none)'),
  ];
  if (productUrl) parts.push('', '*Product link:* ' + productUrl);
  if (imageUrl) parts.push('', '*Card image:* ' + imageUrl);

  const text = parts.join('\n').slice(0, 4000); // Telegram caption limit safety

  // If we have an image, send as photo with caption. Otherwise send text-only.
  if (imageUrl) {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error('Telegram: ' + JSON.stringify(data));
    return { externalId: String(data.result.message_id), url: '', caption: text };
  }

  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error('Telegram: ' + JSON.stringify(data));
  return { externalId: String(data.result.message_id), url: '', caption: text };
}
