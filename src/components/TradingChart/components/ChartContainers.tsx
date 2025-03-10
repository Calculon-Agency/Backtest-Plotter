import React from 'react';
import { DEFAULT_HEIGHT } from '../chartUtils';
import { ChartContainers as ChartContainersType } from '../types';

interface ChartContainersProps {
  containers: ChartContainersType;
}

const ChartContainers: React.FC<ChartContainersProps> = ({ containers }) => {
  const { chartContainerRef, volumeContainerRef, dssContainerRef } = containers;
  
  return (
    <div style={{
      width: '100%',
      height: `${DEFAULT_HEIGHT}px`,
      maxHeight: `${DEFAULT_HEIGHT}px`, 
      backgroundColor: '#131722',
      border: '1px solid #485c7b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div ref={chartContainerRef} style={{ width: '100%' }} />
      <div ref={volumeContainerRef} style={{ width: '100%' }} />
      <div ref={dssContainerRef} style={{ width: '100%' }} />
    </div>
  );
};

export default ChartContainers; 