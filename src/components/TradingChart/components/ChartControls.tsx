import React from 'react';
import SymbolSelector from './SymbolSelector';
import { CandlestickData } from '../types';

interface ChartControlsProps {
  selectedCoin: string;
  isDropdownOpen: boolean;
  searchTerm: string;
  filteredSymbols: string[];
  chartData: CandlestickData[];
  debugInfo: string;
  toggleDropdown: () => void;
  setSearchTerm: (term: string) => void;
  selectCoin: (coin: string) => void;
  onRefreshMarkers: () => void;
  onAddBoxAnnotations: () => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  selectedCoin,
  isDropdownOpen,
  searchTerm,
  filteredSymbols,
  chartData,
  debugInfo,
  toggleDropdown,
  setSearchTerm,
  selectCoin,
  onRefreshMarkers,
  onAddBoxAnnotations
}) => {
  return (
    <div style={{ 
      padding: '10px', 
      backgroundColor: '#131722', 
      borderBottom: '1px solid #485c7b', 
      display: 'flex', 
      alignItems: 'center', 
      flexWrap: 'wrap' 
    }}>
      <SymbolSelector
        selectedCoin={selectedCoin}
        isDropdownOpen={isDropdownOpen}
        searchTerm={searchTerm}
        filteredSymbols={filteredSymbols}
        toggleDropdown={toggleDropdown}
        setSearchTerm={setSearchTerm}
        selectCoin={selectCoin}
      />
      
      <span style={{ marginLeft: '10px', color: '#d1d4dc' }}>
        {chartData.length > 0 ? `Loaded ${chartData.length} records` : 'Loading...'}
      </span>
      
      <span style={{ marginLeft: '10px', color: '#4CAF50' }}>
        {debugInfo}
      </span>
      
      <button 
        onClick={onRefreshMarkers}
        style={{
          marginLeft: '10px',
          backgroundColor: '#2A2E39',
          color: '#d1d4dc',
          padding: '8px',
          border: '1px solid #485c7b',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Refresh Markers
      </button>
      
      <button 
        onClick={onAddBoxAnnotations}
        style={{
          marginLeft: '10px',
          backgroundColor: '#2A2E39',
          color: '#d1d4dc',
          padding: '8px',
          border: '1px solid #485c7b',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Add Box Annotations
      </button>
    </div>
  );
};

export default ChartControls; 