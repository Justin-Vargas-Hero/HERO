'use client';

import { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType,
  LineSeries,
  AreaSeries,
  CandlestickSeries,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';

interface TradingViewChartProps {
  symbol: string;
  type?: 'line' | 'candle' | 'area';
  height?: number;
  realTimePrice?: number;
  data?: any[];
}

export default function TradingViewChart({ 
  symbol, 
  type = 'line',
  height = 400,
  realTimePrice,
  data 
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333333',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: {
          color: '#e5e7eb',
          visible: true,
        },
        horzLines: {
          color: '#e5e7eb',
          visible: true,
        },
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Use provided data or generate sample data
    let chartData = data;
    
    if (!chartData || chartData.length === 0) {
      // Generate sample data only if no data provided
      chartData = [];
      const basePrice = 100 + Math.random() * 50;
      const currentDate = Math.floor(Date.now() / 1000); // Current Unix timestamp
      
      for (let i = 0; i < 100; i++) {
        // Go back in 5-minute intervals
        const time = currentDate - (100 - i) * 300; // 300 seconds = 5 minutes
        
        const randomWalk = (Math.random() - 0.5) * 4;
        const price = basePrice + randomWalk * i * 0.02 + Math.sin(i * 0.1) * 5;
        
        if (type === 'candle') {
          const open = price + (Math.random() - 0.5) * 2;
          const close = price + (Math.random() - 0.5) * 2;
          const high = Math.max(open, close) + Math.random() * 2;
          const low = Math.min(open, close) - Math.random() * 2;
          
          chartData.push({
            time: time,
            open: open,
            high: high,
            low: low,
            close: close,
          });
        } else {
          chartData.push({
            time: time,
            value: price,
          });
        }
      }
    }

    // Ensure data is sorted by time
    chartData.sort((a: any, b: any) => a.time - b.time);

    // Create the appropriate series using addSeries
    let series: ISeriesApi<any>;
    
    if (type === 'candle') {
      // Use green/red colors matching the market page
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#16a34a', // green-600
        downColor: '#dc2626', // red-600
        borderVisible: false,
        wickUpColor: '#16a34a',
        wickDownColor: '#dc2626',
      });
    } else if (type === 'area') {
      series = chart.addSeries(AreaSeries, {
        lineColor: '#16a34a', // green-600
        topColor: 'rgba(22, 163, 74, 0.3)',
        bottomColor: 'rgba(22, 163, 74, 0)',
        lineWidth: 2,
      });
    } else {
      series = chart.addSeries(LineSeries, {
        color: '#2563eb', // blue-600
        lineWidth: 2,
      });
    }

    series.setData(chartData);
    seriesRef.current = series;
    
    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [type, height, data]);

  // Update with real-time price
  useEffect(() => {
    if (realTimePrice && seriesRef.current && data && data.length > 0) {
      const lastDataPoint = data[data.length - 1];
      const now = Math.floor(Date.now() / 1000);
      
      // Only update if enough time has passed since last data point
      if (now - lastDataPoint.time > 60) {
        if (type === 'candle') {
          seriesRef.current.update({
            time: now,
            open: realTimePrice,
            high: realTimePrice,
            low: realTimePrice,
            close: realTimePrice,
          });
        } else {
          seriesRef.current.update({
            time: now,
            value: realTimePrice,
          });
        }
      }
    }
  }, [realTimePrice, type, data]);

  return (
    <div 
      ref={chartContainerRef}
      className="w-full"
      style={{ minHeight: height }}
    />
  );
}