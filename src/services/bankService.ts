import axios from 'axios';

interface BankInfo {
    id: number;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
    transferSupported: number;
    lookupSupported: number;
}

interface BankResponse {
    code: string;
    desc: string;
    data: BankInfo[];
}

export class BankService {
    private static readonly bankCache: Map<string, BankInfo> = new Map();
    private static lastFetchTime: number = 0;
    private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

    private static async fetchBanks(): Promise<void> {
        try {
            const now = Date.now();
            if (now - this.lastFetchTime < this.CACHE_DURATION && this.bankCache.size > 0) {
                return;
            }

            const { data } = await axios.get<BankResponse>('https://api.vietqr.io/v2/banks');

            if (data.code === '00') {
                this.bankCache.clear();
                data.data.forEach(bank => {
                    this.bankCache.set(bank.bin, bank);
                });
                this.lastFetchTime = now;
                console.log('Đã cập nhật danh sách ngân hàng thành công');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Lỗi khi lấy danh sách ngân hàng:', error.message);
            } else {
                console.error('Lỗi không xác định:', error);
            }
        }
    }

    public static async getBankName(bin: string): Promise<string> {
        await this.fetchBanks();
        const bank = this.bankCache.get(bin);
        return bank?.shortName ?? bin;
    }

    public static async getBankInfo(bin: string): Promise<BankInfo | null> {
        await this.fetchBanks();
        return this.bankCache.get(bin) ?? null;
    }
}