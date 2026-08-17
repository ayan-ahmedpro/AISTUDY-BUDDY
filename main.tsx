import {StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { NavigationProvider } from './context/NavigationContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavigationProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-[#fdfcfb] dark:bg-[#030712] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <App />
      </Suspense>
    </NavigationProvider>
  </StrictMode>,
);
