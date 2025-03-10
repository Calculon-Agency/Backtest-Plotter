/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useChartData } from './hooks/useChartData';
import { useSymbols } from './hooks/useSymbols';
import { useChartInitialization } from './hooks/useChartInitialization';
import { useChartUpdater } from './hooks/useChartUpdater';
import ChartControls from './components/ChartControls';
import ChartContainers from './components/ChartContainers';
import { CandlestickData } from './types';

const TradingChart: React.FC = () => {
  // Initialize symbols and selection
  const {
    availableSymbols,
    selectedCoin,
    searchTerm,
    isDropdownOpen,
    filteredSymbols,
    setSearchTerm,
    selectCoin,
    toggleDropdown
  } = useSymbols();

  // Initialize chart data
  const { chartData, error, debugInfo, setDebugInfo } = useChartData(selectedCoin);

  // Initialize chart components
  const [chartRefs, containers] = useChartInitialization();

  // Chart updater for when data changes
  const { refreshMarkers, refreshBoxAnnotations } = useChartUpdater(
    chartData, 
    chartRefs,
    setDebugInfo
  );

  // Error display
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#FF5252', 
        backgroundColor: '#131722',
        border: '1px solid #485c7b',
        borderRadius: '4px',
        margin: '10px'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#131722', overflow: 'hidden', position: 'relative' }}>
      <ChartControls
        selectedCoin={selectedCoin}
        isDropdownOpen={isDropdownOpen}
        searchTerm={searchTerm}
        filteredSymbols={filteredSymbols}
        chartData={chartData}
        debugInfo={debugInfo}
        toggleDropdown={toggleDropdown}
        setSearchTerm={setSearchTerm}
        selectCoin={selectCoin}
        onRefreshMarkers={refreshMarkers}
        onAddBoxAnnotations={refreshBoxAnnotations}
      />
      <ChartContainers containers={containers} />
    </div>
  );
};

export default TradingChart;
