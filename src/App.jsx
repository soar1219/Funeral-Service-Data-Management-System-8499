import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import OCRCapture from './pages/OCRCapture';
import DataManagement from './pages/DataManagement';
import PrintReports from './pages/PrintReports';
import Settings from './pages/Settings';
import { DataProvider } from './context/DataContext';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // アプリケーション初期化
    const initializeApp = async () => {
      try {
        // ローカルストレージの初期化
        if (!localStorage.getItem('funeral-donations')) {
          localStorage.setItem('funeral-donations', JSON.stringify([]));
        }
        if (!localStorage.getItem('funeral-settings')) {
          localStorage.setItem('funeral-settings', JSON.stringify({
            funeralHomeName: '葬儀場名',
            address: '住所',
            phone: '電話番号',
            autoSave: true,
            ocrLanguage: 'jpn'
          }));
        }
        
        // 少し待機してローディング画面を表示
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
      } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-funeral-50 to-funeral-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-funeral-300 border-t-funeral-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-funeral-800 mb-2">香典記録システム</h2>
          <p className="text-funeral-600">システムを起動しています...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-funeral-50 to-funeral-100">
          <Navigation />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ocr" element={<OCRCapture />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/print" element={<PrintReports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#343a40',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;