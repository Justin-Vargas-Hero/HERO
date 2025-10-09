import { NextResponse } from 'next/server';

// S&P 500 top tickers
const SP500_TICKERS = [
    'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'BRK.B', 'AVGO', 'LLY',
    'JPM', 'WMT', 'V', 'ORCL', 'MA', 'NFLX', 'XOM', 'UNH', 'JNJ', 'HD',
    'PG', 'COST', 'ABBV', 'BAC', 'CRM', 'AMD', 'CVX', 'PLTR', 'KO', 'PEP',
    'CSCO', 'TMO', 'MRK', 'IBM', 'GE', 'CAT', 'WFC', 'TMUS', 'DIS', 'VZ',
    'PM', 'ABT', 'INTC', 'ADBE', 'QCOM', 'MCD', 'MS', 'GS', 'RTX', 'AXP',
    'INTU', 'TXN', 'NOW', 'HON', 'NEE', 'BA', 'UBER', 'T', 'LOW', 'AMAT',
    'BLK', 'SPGI', 'C', 'UPS', 'AMGN', 'SCHW', 'LIN', 'MU', 'NKE', 'PFE',
    'ACN', 'DHR', 'TJX', 'GILD', 'LRCX', 'BKNG', 'MDT', 'ETN', 'APP', 'GEV',
    'ISRG', 'ANET', 'BSX', 'SYK', 'PANW', 'KLAC', 'APH', 'PGR', 'UNP', 'COF',
    'CRWD', 'HOOD', 'DASH', 'BX', 'DE', 'LMT', 'ADI', 'ADP', 'COP', 'CEG'
];

// NASDAQ 100 tickers (top stocks from NASDAQ exchange)
const NASDAQ_TICKERS = [
    'NVDA', 'AAPL', 'MSFT', 'AMZN', 'META', 'AVGO', 'GOOGL', 'GOOG', 'TSLA', 'COST',
    'NFLX', 'AMD', 'PEP', 'ADBE', 'CSCO', 'TMUS', 'INTC', 'QCOM', 'INTU', 'AMGN',
    'ISRG', 'TXN', 'AMAT', 'CMCSA', 'BKNG', 'HON', 'ARM', 'VRTX', 'SBUX', 'PANW',
    'MU', 'ADP', 'GILD', 'ADI', 'LRCX', 'MDLZ', 'REGN', 'MELI', 'KLAC', 'SNPS',
    'CDNS', 'PYPL', 'ABNB', 'CRWD', 'MAR', 'ORLY', 'CTAS', 'NXPI', 'ASML', 'MRVL',
    'PDD', 'FTNT', 'DASH', 'CSX', 'PCAR', 'WDAY', 'CHTR', 'ROP', 'TTD', 'PAYX',
    'CPRT', 'MNST', 'FANG', 'ROST', 'AEP', 'FAST', 'ODFL', 'EA', 'KDP', 'VRSK',
    'GEHC', 'EXC', 'BKR', 'KHC', 'LULU', 'IDXX', 'CTSH', 'DDOG', 'CSGP', 'ON',
    'BIIB', 'TEAM', 'ILMN', 'ANSS', 'MCHP', 'DXCM', 'AZN', 'MRNA', 'ZS', 'TTWO',
    'WBD', 'GFS', 'CDW', 'DLTR', 'WBA', 'SGEN', 'SPLK', 'ALGN', 'ENPH', 'SMCI'
];

// Market caps for all tickers (in billions)
const MARKET_CAPS: Record<string, number> = {
    // S&P 500 & shared
    'NVDA': 4680, 'AAPL': 3920, 'MSFT': 3900, 'AMZN': 2350, 'GOOGL': 2280,
    'META': 1820, 'AVGO': 1600, 'TSLA': 1380, 'BRK.B': 1040, 'LLY': 805,
    'JPM': 868, 'WMT': 828, 'ORCL': 790, 'V': 715, 'MA': 537,
    'NFLX': 523, 'XOM': 457, 'JNJ': 456, 'COST': 412, 'ABBV': 409,
    'HD': 379, 'BAC': 389, 'AMD': 383, 'UNH': 343, 'PG': 352,
    'GE': 326, 'PLTR': 408, 'CVX': 283, 'KO': 285, 'CSCO': 283,
    'WFC': 280, 'IBM': 267, 'TMUS': 261, 'MS': 257, 'CAT': 248,
    'GS': 248, 'LIN': 234, 'CRM': 231, 'MRK': 218, 'MU': 217,
    'MCD': 212, 'TMO': 205, 'DIS': 203, 'PM': 241, 'PEP': 192,
    
    // NASDAQ specific
    'GOOG': 2200, 'ARM': 180, 'VRTX': 125, 'SBUX': 110, 'CMCSA': 150,
    'REGN': 85, 'MELI': 98, 'SNPS': 88, 'CDNS': 82, 'PYPL': 75,
    'ABNB': 82, 'MAR': 68, 'ORLY': 71, 'CTAS': 85, 'NXPI': 65,
    'ASML': 380, 'MRVL': 95, 'PDD': 192, 'FTNT': 98, 'CSX': 68,
    'PCAR': 58, 'WDAY': 72, 'CHTR': 55, 'ROP': 58, 'TTD': 52,
    'PAYX': 62, 'CPRT': 56, 'MNST': 48, 'FANG': 92, 'ROST': 48,
    'AEP': 95, 'FAST': 45, 'ODFL': 52, 'EA': 38, 'KDP': 68,
    'VRSK': 48, 'GEHC': 42, 'EXC': 38, 'BKR': 45, 'KHC': 42,
    'LULU': 51, 'IDXX': 38, 'CTSH': 35, 'DDOG': 58, 'CSGP': 32,
    'ON': 48, 'BIIB': 32, 'TEAM': 52, 'ILMN': 22, 'ANSS': 32,
    'MCHP': 38, 'DXCM': 45, 'AZN': 245, 'MRNA': 28, 'ZS': 35,
    'TTWO': 31, 'WBD': 12, 'GFS': 28, 'CDW': 42, 'DLTR': 15,
    'WBA': 8, 'SGEN': 32, 'SPLK': 28, 'ALGN': 15, 'ENPH': 12,
    'SMCI': 35, 'MDLZ': 92,
    
    // Additional S&P 500 market caps
    'GEV': 163, 'ADI': 116, 'BX': 126, 'HOOD': 130, 'INTC': 158,
    'QCOM': 186, 'VZ': 174, 'NEE': 174, 'T': 188, 'ABT': 232,
    'ADBE': 158, 'TXN': 164, 'NOW': 188, 'HON': 134, 'BA': 136,
    'UBER': 207, 'LOW': 133, 'AMAT': 178, 'BLK': 176, 'SPGI': 152,
    'C': 179, 'UPS': 113, 'AMGN': 154, 'SCHW': 171, 'NKE': 111,
    'PFE': 145, 'ACN': 159, 'DHR': 148, 'TJX': 159, 'GILD': 146,
    'LRCX': 185, 'BKNG': 178, 'MDT': 123, 'ETN': 149, 'APP': 208,
    'ISRG': 160, 'ANET': 198, 'BSX': 143, 'SYK': 143, 'PANW': 145,
    'KLAC': 143, 'APH': 151, 'PGR': 142, 'UNP': 143, 'COF': 82,
    'CRWD': 124, 'DASH': 118, 'DE': 127, 'LMT': 122, 'ADP': 118,
    'COP': 111, 'CEG': 123, 'INTU': 184, 'RTX': 240, 'AXP': 233
};

// Sector mapping
const SECTORS: Record<string, string> = {
    // Technology
    'NVDA': 'Technology', 'AAPL': 'Technology', 'MSFT': 'Technology', 'AMZN': 'Technology',
    'GOOGL': 'Technology', 'GOOG': 'Technology', 'META': 'Technology', 'TSLA': 'Technology',
    'AVGO': 'Technology', 'ORCL': 'Technology', 'NFLX': 'Technology', 'CRM': 'Technology',
    'AMD': 'Technology', 'CSCO': 'Technology', 'INTC': 'Technology', 'ADBE': 'Technology',
    'QCOM': 'Technology', 'NOW': 'Technology', 'AMAT': 'Technology', 'LRCX': 'Technology',
    'ANET': 'Technology', 'PANW': 'Technology', 'KLAC': 'Technology', 'APH': 'Technology',
    'CRWD': 'Technology', 'DASH': 'Technology', 'ADI': 'Technology', 'ADP': 'Technology',
    'IBM': 'Technology', 'PLTR': 'Technology', 'UBER': 'Technology', 'APP': 'Technology',
    'INTU': 'Technology', 'TXN': 'Technology', 'ACN': 'Technology', 'MU': 'Technology',
    'ARM': 'Technology', 'SNPS': 'Technology', 'CDNS': 'Technology', 'PYPL': 'Technology',
    'MRVL': 'Technology', 'FTNT': 'Technology', 'WDAY': 'Technology', 'TTD': 'Technology',
    'DDOG': 'Technology', 'ON': 'Technology', 'TEAM': 'Technology', 'ANSS': 'Technology',
    'MCHP': 'Technology', 'ZS': 'Technology', 'CDW': 'Technology', 'SPLK': 'Technology',
    'SMCI': 'Technology', 'NXPI': 'Technology', 'ASML': 'Technology',
    
    // Healthcare
    'LLY': 'Healthcare', 'UNH': 'Healthcare', 'JNJ': 'Healthcare', 'ABBV': 'Healthcare',
    'TMO': 'Healthcare', 'MRK': 'Healthcare', 'ABT': 'Healthcare', 'PFE': 'Healthcare',
    'DHR': 'Healthcare', 'GILD': 'Healthcare', 'MDT': 'Healthcare', 'ISRG': 'Healthcare',
    'BSX': 'Healthcare', 'SYK': 'Healthcare', 'AMGN': 'Healthcare', 'VRTX': 'Healthcare',
    'REGN': 'Healthcare', 'IDXX': 'Healthcare', 'BIIB': 'Healthcare', 'ILMN': 'Healthcare',
    'DXCM': 'Healthcare', 'AZN': 'Healthcare', 'MRNA': 'Healthcare', 'SGEN': 'Healthcare',
    'ALGN': 'Healthcare', 'GEHC': 'Healthcare',
    
    // Financial
    'BRK.B': 'Financial', 'JPM': 'Financial', 'V': 'Financial', 'MA': 'Financial',
    'BAC': 'Financial', 'WFC': 'Financial', 'MS': 'Financial', 'GS': 'Financial',
    'AXP': 'Financial', 'BLK': 'Financial', 'SPGI': 'Financial', 'C': 'Financial',
    'SCHW': 'Financial', 'BX': 'Financial', 'COF': 'Financial', 'PGR': 'Financial',
    'HOOD': 'Financial', 'PAYX': 'Financial',
    
    // Consumer
    'WMT': 'Consumer', 'HD': 'Consumer', 'PG': 'Consumer', 'COST': 'Consumer',
    'KO': 'Consumer', 'PEP': 'Consumer', 'MCD': 'Consumer', 'LOW': 'Consumer',
    'NKE': 'Consumer', 'TJX': 'Consumer', 'BKNG': 'Consumer', 'SBUX': 'Consumer',
    'MDLZ': 'Consumer', 'MAR': 'Consumer', 'ORLY': 'Consumer', 'CTAS': 'Consumer',
    'ROST': 'Consumer', 'LULU': 'Consumer', 'KDP': 'Consumer', 'KHC': 'Consumer',
    'DLTR': 'Consumer', 'WBA': 'Consumer', 'ABNB': 'Consumer', 'MELI': 'Consumer',
    'PDD': 'Consumer', 'MNST': 'Consumer', 'EA': 'Consumer', 'TTWO': 'Consumer',
    
    // Other sectors
    'DIS': 'Entertainment', 'WBD': 'Entertainment', 'CMCSA': 'Media',
    'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'FANG': 'Energy', 'BKR': 'Energy',
    'GE': 'Industrial', 'CAT': 'Industrial', 'RTX': 'Defense', 'HON': 'Industrial',
    'BA': 'Aerospace', 'UPS': 'Industrial', 'LIN': 'Industrial', 'ETN': 'Industrial',
    'GEV': 'Industrial', 'DE': 'Industrial', 'LMT': 'Defense', 'UNP': 'Industrial',
    'CSX': 'Industrial', 'PCAR': 'Industrial', 'ROP': 'Industrial', 'CPRT': 'Industrial',
    'FAST': 'Industrial', 'ODFL': 'Industrial', 'VRSK': 'Industrial', 'GFS': 'Industrial',
    'TMUS': 'Telecommunications', 'VZ': 'Telecommunications', 'T': 'Telecommunications', 'CHTR': 'Telecommunications',
    'PM': 'Consumer', 'NEE': 'Utilities', 'CEG': 'Utilities', 'AEP': 'Utilities', 'EXC': 'Utilities',
    'CTSH': 'Technology', 'CSGP': 'Financial', 'ENPH': 'Energy'
};

// Generate stock data for a given list of tickers
function generateStockData(tickers: string[]) {
    return tickers.map(symbol => {
        const basePrice = 50 + Math.random() * 500;
        let changePercent = (Math.random() - 0.48) * 5;
        
        // Ensure we don't have exactly 0% unless intended
        if (Math.abs(changePercent) < 0.01) {
            changePercent = 0.01 * (Math.random() > 0.5 ? 1 : -1);
        }
        
        const change = (basePrice * changePercent) / 100;
        
        const stockInfo = {
            symbol,
            price: parseFloat(basePrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: Math.floor(Math.random() * 100000000),
            marketCap: (MARKET_CAPS[symbol] || 100) * 1000000000,
            sector: SECTORS[symbol] || 'Other'
        };
        
        // Special case for Netflix
        if (symbol === 'NFLX') {
            stockInfo.price = 1214.25;
            stockInfo.changePercent = 1.95;
            stockInfo.change = 23.19;
        }
        
        return stockInfo;
    });
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const index = searchParams.get('index') || 'SP500';
        
        const tickers = index === 'NASDAQ' ? NASDAQ_TICKERS : SP500_TICKERS;
        const stockData = generateStockData(tickers);
        
        return NextResponse.json({
            data: stockData,
            index: index,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching market data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market data' },
            { status: 500 }
        );
    }
}