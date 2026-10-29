import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import './baiduTongji';
import App from './App.tsx';
import './index.css';
import SiteNavigation from './routes/SiteNavigation';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SiteNavigation><App /></SiteNavigation>
    </BrowserRouter>
  </StrictMode>,
);

const metricSampleRate = Number(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE ?? 0.1);
if (import.meta.env.PROD && Math.random() < Math.min(1, Math.max(0, metricSampleRate))) {
  void import('./lib/performanceMetrics').then(module => module.startPerformanceMetrics()).catch(() => {});
}
