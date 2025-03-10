import React from 'react';

interface SymbolSelectorProps {
  selectedCoin: string;
  isDropdownOpen: boolean;
  searchTerm: string;
  filteredSymbols: string[];
  toggleDropdown: () => void;
  setSearchTerm: (term: string) => void;
  selectCoin: (coin: string) => void;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedCoin,
  isDropdownOpen,
  searchTerm,
  filteredSymbols,
  toggleDropdown,
  setSearchTerm,
  selectCoin
}) => {
  return (
    <div style={{ position: 'relative', minWidth: '200px' }}>
      <div 
        style={{
          backgroundColor: '#2A2E39',
          color: '#d1d4dc',
          padding: '8px',
          border: '1px solid #485c7b',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={toggleDropdown}
      >
        <span>{selectedCoin}</span>
        <span style={{ marginLeft: '8px' }}>▼</span>
      </div>
      
      {isDropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          backgroundColor: '#2A2E39',
          border: '1px solid #485c7b',
          borderRadius: '0 0 4px 4px',
          zIndex: 10,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coins..."
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1E222D',
              color: '#d1d4dc',
              border: 'none',
              borderBottom: '1px solid #485c7b',
              fontSize: '14px',
              outline: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map(coin => (
                <div
                  key={coin}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedCoin === coin ? '#364156' : 'transparent',
                    color: '#d1d4dc',
                    borderBottom: '1px solid #343a45',
                    fontSize: '14px'
                  }}
                  onClick={() => selectCoin(coin)}
                >
                  {coin}
                </div>
              ))
            ) : (
              <div style={{ padding: '8px', color: '#758696', fontSize: '14px' }}>
                No coins found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSelector; 