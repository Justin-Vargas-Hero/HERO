'use client';

import { useEffect, useState } from 'react';

interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    sector: string;
}

interface TooltipData {
    stock: StockData;
    x: number;
    y: number;
    isTopRow: boolean;
}

export default function MarketHeatmap() {
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [nasdaqStocks, setNasdaqStocks] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [selectedIndex, setSelectedIndex] = useState<'SP500' | 'NASDAQ'>('SP500');

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const response = await fetch(`/api/market?index=${selectedIndex}`);
                if (!response.ok) throw new Error('Failed to fetch market data');
                const data = await response.json();
                
                if (selectedIndex === 'SP500') {
                    setStocks(data.data || []);
                } else {
                    setNasdaqStocks(data.data || []);
                }
                
                setLoading(false);
                setLastUpdated(new Date());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 60000);
        return () => clearInterval(interval);
    }, [selectedIndex]);

    const getColorClass = (changePercent: number) => {
        if (changePercent > 0) {
            if (changePercent >= 3) return 'bg-green-300 border-green-400';
            if (changePercent >= 2) return 'bg-green-200 border-green-300';
            if (changePercent >= 1) return 'bg-green-100 border-green-200';
            return 'bg-green-50 border-green-200';
        } else if (changePercent < 0) {
            if (changePercent <= -3) return 'bg-red-300 border-red-400';
            if (changePercent <= -2) return 'bg-red-200 border-red-300';
            if (changePercent <= -1) return 'bg-red-100 border-red-200';
            return 'bg-red-50 border-red-200';
        }
        return 'bg-gray-50 border-gray-300';
    };

    const getTextColor = (changePercent: number) => {
        const absPercent = Math.abs(changePercent);
        if (absPercent >= 3) return 'text-white';
        if (changePercent > 0) return 'text-green-800';
        if (changePercent < 0) return 'text-red-800';
        return 'text-gray-700';
    };

    // Square-ish aspect ratios
    const getSize = (marketCap: number, index: number) => {
        const billion = 1000000000;
        const trillion = 1000000000000;
        
        const variant = (index * 7) % 11;
        
        if (marketCap >= 3 * trillion) {
            const patterns = [
                'col-span-4 row-span-4',
                'col-span-5 row-span-5',
                'col-span-4 row-span-5',
            ];
            return patterns[variant % patterns.length];
        }
        if (marketCap >= 2 * trillion) {
            const patterns = [
                'col-span-4 row-span-4',
                'col-span-3 row-span-4',
                'col-span-4 row-span-3',
            ];
            return patterns[variant % patterns.length];
        }
        if (marketCap >= 1 * trillion) {
            const patterns = [
                'col-span-3 row-span-3',
                'col-span-4 row-span-3',
                'col-span-3 row-span-4',
            ];
            return patterns[variant % patterns.length];
        }
        if (marketCap >= 500 * billion) {
            const patterns = [
                'col-span-3 row-span-3',
                'col-span-2 row-span-3',
                'col-span-3 row-span-2',
            ];
            return patterns[variant % patterns.length];
        }
        if (marketCap >= 200 * billion) {
            const patterns = [
                'col-span-2 row-span-2',
                'col-span-3 row-span-2',
                'col-span-2 row-span-3',
            ];
            return patterns[variant % patterns.length];
        }
        if (marketCap >= 100 * billion) {
            const patterns = [
                'col-span-2 row-span-2',
                'col-span-2 row-span-1',
                'col-span-1 row-span-2',
            ];
            return patterns[variant % patterns.length];
        }
        if (marketCap >= 50 * billion) {
            return 'col-span-1 row-span-1';
        }
        return 'col-span-1 row-span-1';
    };

    const handleMouseEnter = (stock: StockData, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const isTopRow = rect.top < 200;
        
        setTooltip({
            stock,
            x: rect.left + rect.width / 2,
            y: isTopRow ? rect.bottom : rect.top,
            isTopRow
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const formatVolume = (volume: number) => {
        if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}B`;
        if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
        if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
        return volume.toString();
    };

    const formatMarketCap = (marketCap: number) => {
        if (marketCap >= 1000000000000) return `$${(marketCap / 1000000000000).toFixed(2)}T`;
        if (marketCap >= 1000000000) return `$${(marketCap / 1000000000).toFixed(0)}B`;
        if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(0)}M`;
        return `$${marketCap}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 56px)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 56px)' }}>
                <div className="text-center">
                    <p className="text-red-600 mb-2">Failed to load market data</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const currentStocks = selectedIndex === 'SP500' ? stocks : nasdaqStocks;
    const sortedStocks = [...currentStocks].sort((a, b) => b.marketCap - a.marketCap);

    return (
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
            {/* Header - 48px */}
            <div className="h-12 px-6 bg-white flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900 mr-3">Market Performance</h1>
                    <select
                        value={selectedIndex}
                        onChange={(e) => setSelectedIndex(e.target.value as 'SP500' | 'NASDAQ')}
                        className="px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ paddingTop: '2px', paddingBottom: '2px' }}
                    >
                        <option value="SP500">S&P 500</option>
                        <option value="NASDAQ">NASDAQ</option>
                    </select>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">
                        Last updated: {lastUpdated.toUTCString().slice(17, 25)} UTC
                    </div>
                    <div className="text-xs text-gray-400">
                        Automatically updated every minute
                    </div>
                </div>
            </div>

            {/* Heatmap Grid - White background, reduced by 10px */}
            <div 
                className="flex-1 bg-white p-1 overflow-hidden"
                style={{ height: 'calc(100vh - 106px)' }}
            >
                <div className="grid grid-cols-24 auto-rows-[1fr] gap-[2px] h-full">
                    {sortedStocks.map((stock, index) => (
                        <div
                            key={stock.symbol}
                            className={`
                                ${getSize(stock.marketCap, index)}
                                ${getColorClass(stock.changePercent)}
                                ${getTextColor(stock.changePercent)}
                                rounded-md cursor-pointer border
                                transition-all duration-200 hover:shadow-lg hover:z-20
                                flex flex-col justify-center items-center text-center
                                relative
                            `}
                            onMouseEnter={(e) => handleMouseEnter(stock, e)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="font-bold text-xs lg:text-sm">
                                {stock.symbol}
                            </div>
                            <div className="font-semibold text-[10px] lg:text-xs">
                                {stock.changePercent > 0 && '+'}{stock.changePercent.toFixed(2)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div 
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${tooltip.x}px`,
                        top: tooltip.isTopRow ? `${tooltip.y + 10}px` : `${tooltip.y - 10}px`,
                        transform: tooltip.isTopRow ? 'translateX(-50%)' : 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[240px]">
                        <div className="space-y-3">
                            <div className="border-b border-gray-100 pb-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-lg text-gray-900">{tooltip.stock.symbol}</span>
                                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                                        tooltip.stock.changePercent > 0 
                                            ? 'bg-green-100 text-green-700' 
                                            : tooltip.stock.changePercent < 0 
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {tooltip.stock.changePercent > 0 && '+'}{tooltip.stock.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{tooltip.stock.sector}</div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Price:</span>
                                    <span className="font-semibold text-gray-900">${tooltip.stock.price.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Change:</span>
                                    <span className={`font-semibold ${
                                        tooltip.stock.change > 0 ? 'text-green-600' : 
                                        tooltip.stock.change < 0 ? 'text-red-600' : 
                                        'text-gray-600'
                                    }`}>
                                        {tooltip.stock.change > 0 && '+'}${Math.abs(tooltip.stock.change).toFixed(2)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Volume:</span>
                                    <span className="font-semibold text-gray-900">{formatVolume(tooltip.stock.volume)}</span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Market Cap:</span>
                                    <span className="font-semibold text-gray-900">{formatMarketCap(tooltip.stock.marketCap)}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Arrow */}
                        {tooltip.isTopRow ? (
                            <div className="absolute left-1/2 transform -translate-x-1/2 top-[-8px]">
                                <svg width="16" height="8" viewBox="0 0 16 8" className="drop-shadow-sm">
                                    <path d="M 0 8 L 8 0 L 16 8 Z" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                                </svg>
                            </div>
                        ) : (
                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-8px]">
                                <svg width="16" height="8" viewBox="0 0 16 8" className="drop-shadow-sm">
                                    <path d="M 0 0 L 8 8 L 16 0 Z" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}