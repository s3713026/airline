import { getConfig, setConfig } from '@/helpers/configHelper';

export interface SystemConfig {
  smtp_name: string;
  smtp_user: string;
  smtp_pass: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  bank_name: string;
  bank_account: string;
  bank_branch: string;
}

export const configModel = {
  async getAllConfigs(): Promise<SystemConfig> {
    const [
      smtp_name,
      smtp_user,
      smtp_pass,
      telegram_bot_token,
      telegram_chat_id,
      bank_name,
      bank_account,
      bank_branch
    ] = await Promise.all([
      getConfig('smtp_name'),
      getConfig('smtp_user'),
      getConfig('smtp_pass'),
      getConfig('telegram_bot_token'),
      getConfig('telegram_chat_id'),
      getConfig('bank_name'),
      getConfig('bank_account'),
      getConfig('bank_branch')
    ]);

    return {
      smtp_name: smtp_name ?? '',
      smtp_user: smtp_user ?? '',
      smtp_pass: smtp_pass ?? '',
      telegram_bot_token: telegram_bot_token ?? '',
      telegram_chat_id: telegram_chat_id ?? '',
      bank_name: bank_name ?? '',
      bank_account: bank_account ?? '',
      bank_branch: bank_branch ?? ''
    };
  },

  async updateConfigs(configs: Partial<SystemConfig>): Promise<void> {
    const updates = Object.entries(configs).map(([key, value]) =>
      setConfig(key, value ?? '')
    );
    await Promise.all(updates);
  },

  async getBankConfig() {
    const [bank_name, bank_account, bank_branch] = await Promise.all([
      getConfig('bank_name'),
      getConfig('bank_account'),
      getConfig('bank_branch')
    ]);

    return {
      bank_name: bank_name ?? '',
      bank_account: bank_account ?? '',
      bank_branch: bank_branch ?? ''
    };
  }
};