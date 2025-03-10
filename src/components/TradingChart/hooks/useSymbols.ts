import { useState, useEffect } from 'react';

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'LTCUSDT', 'EOSUSDT', 'NEOUSDT', 'QTUMUSDT'];

export const useSymbols = (initialCoin: string = 'BTCUSDT') => {
  const [availableSymbols, setAvailableSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [selectedCoin, setSelectedCoin] = useState<string>(initialCoin);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  // Filter symbols based on search term
  const filteredSymbols = availableSymbols.filter(symbol => 
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch('https://api.coinchart.fun/symbol_list');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const symbolData = await response.json();
        // Extract unique symbols from the binance exchange
        const binanceSymbols = symbolData
          .filter((item: { exchange: string }) => item.exchange === 'binance')
          .map((item: { symbol: string }) => item.symbol);
        
        // Only update if we have symbols
        if (binanceSymbols.length > 0) {
          setAvailableSymbols(binanceSymbols);
          // Set default selected coin if current selection is not available
          if (!binanceSymbols.includes(selectedCoin)) {
            setSelectedCoin(binanceSymbols[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching symbols:', error);
        // Keep using default symbols if API fails
      }
    };
    
    fetchSymbols();
  }, [selectedCoin]);

  const selectCoin = (coin: string) => {
    setSelectedCoin(coin);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return {
    availableSymbols,
    selectedCoin,
    searchTerm,
    isDropdownOpen,
    filteredSymbols,
    setSearchTerm,
    selectCoin,
    toggleDropdown
  };
}; 