
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">AI가 평가 자료를 생성하고 있습니다. 잠시만 기다려주세요...</p>
    </div>
  );
};

export default LoadingSpinner;