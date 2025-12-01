import { db } from '@/config/database';

export const getConfig = async (key: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT value FROM system_configs WHERE key = ?',
      [key],
      (err, row: { value: string } | undefined) => {
        if (err) reject(err);
        resolve(row?.value ?? null);
      }
    );
  });
};

export const setConfig = async (key: string, value: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO system_configs (key, value) VALUES (?, ?)',
      [key, value],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

export const getSmtpConfig = async () => {
  const [name, user, pass] = await Promise.all([
    getConfig('smtp_name'),
    getConfig('smtp_user'),
    getConfig('smtp_pass')
  ]);

  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: user ?? '',
      pass: pass ?? ''
    },
    from: name ? `${name} <${user}>` : user
  };
};

export const getTelegramConfig = async () => {
  const [botToken, chatId] = await Promise.all([
    getConfig('telegram_bot_token'),
    getConfig('telegram_chat_id')
  ]);

  return {
    botToken: botToken ?? '',
    chatId: chatId ?? ''
  };
};

export const getBankConfig = async () => {
  const [name, account, branch] = await Promise.all([
    getConfig('bank_name'),
    getConfig('bank_account'),
    getConfig('bank_branch')
  ]);

  return {
    name: name ?? '',
    account: account ?? '',
    branch: branch ?? ''
  };
};
