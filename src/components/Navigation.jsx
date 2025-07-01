import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useData } from '../context/DataContext';

const {
  FiHome,
  FiCamera,
  FiDatabase,
  FiPrinter,
  FiSettings,
  FiMenu,
  FiX,
  FiChevronDown
} = FiIcons;

const Navigation = () => {
  const location = useLocation();
  const { currentFuneral, funerals, switchToFuneral } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFuneralDropdown, setShowFuneralDropdown] = useState(false);

  const navigationItems = [
    { path: '/', label: 'ダッシュボード', icon: FiHome },
    { path: '/ocr', label: 'OCR入力', icon: FiCamera, disabled: !currentFuneral },
    { path: '/data', label: 'データ管理', icon: FiDatabase, disabled: !currentFuneral },
    { path: '/print', label: '印刷・出力', icon: FiPrinter, disabled: !currentFuneral },
    { path: '/settings', label: '設定', icon: FiSettings }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleFuneralSelect = (funeral) => {
    switchToFuneral(funeral);
    setShowFuneralDropdown(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-funeral-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-funeral-600 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiDatabase} className="text-white text-lg" />
                </div>
                <span className="text-xl font-bold text-funeral-800">香典記録システム</span>
              </Link>
            </div>

            {/* 現在の葬儀表示（デスクトップ） */}
            {currentFuneral && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowFuneralDropdown(!showFuneralDropdown)}
                    className="flex items-center space-x-2 px-3 py-2 bg-funeral-100 text-funeral-700 rounded-lg hover:bg-funeral-200 transition-colors"
                  >
                    <span className="font-medium">{currentFuneral.familyName}家</span>
                    <SafeIcon icon={FiChevronDown} className="text-sm" />
                  </button>
                  
                  {showFuneralDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-1 right-0 bg-white border border-funeral-200 rounded-lg shadow-lg min-w-48 z-50"
                    >
                      <div className="py-1">
                        {funerals.map((funeral) => (
                          <button
                            key={funeral.id}
                            onClick={() => handleFuneralSelect(funeral)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-funeral-50 transition-colors ${
                              currentFuneral.id === funeral.id
                                ? 'bg-funeral-100 text-funeral-800 font-medium'
                                : 'text-funeral-600'
                            }`}
                          >
                            <div>
                              <p className="font-medium">{funeral.familyName}家</p>
                              {funeral.deceasedName && (
                                <p className="text-xs text-funeral-500">故 {funeral.deceasedName} 様</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* デスクトップナビゲーション */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                item.disabled ? (
                  <div
                    key={item.path}
                    className="px-4 py-2 rounded-lg text-funeral-400 cursor-not-allowed opacity-50 flex items-center space-x-2"
                    title="葬儀を選択してください"
                  >
                    <SafeIcon icon={item.icon} className="text-sm" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      location.pathname === item.path
                        ? 'bg-funeral-600 text-white shadow-md'
                        : 'text-funeral-600 hover:bg-funeral-100'
                    }`}
                  >
                    <SafeIcon icon={item.icon} className="text-sm" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              ))}
            </div>

            {/* モバイルメニューボタン */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-funeral-600 hover:bg-funeral-100 transition-colors"
              >
                <SafeIcon icon={isMobileMenuOpen ? FiX : FiMenu} className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-funeral-200"
          >
            <div className="px-4 py-2 space-y-1">
              {/* 現在の葬儀表示（モバイル） */}
              {currentFuneral && (
                <div className="mb-4 p-3 bg-funeral-50 rounded-lg">
                  <p className="text-sm text-funeral-600">現在の葬儀</p>
                  <p className="font-semibold text-funeral-800">{currentFuneral.familyName}家</p>
                  {currentFuneral.deceasedName && (
                    <p className="text-xs text-funeral-600">故 {currentFuneral.deceasedName} 様</p>
                  )}
                </div>
              )}

              {navigationItems.map((item) => (
                item.disabled ? (
                  <div
                    key={item.path}
                    className="block px-4 py-3 rounded-lg text-funeral-400 cursor-not-allowed opacity-50 flex items-center space-x-3"
                  >
                    <SafeIcon icon={item.icon} className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                      location.pathname === item.path
                        ? 'bg-funeral-600 text-white'
                        : 'text-funeral-600 hover:bg-funeral-100'
                    }`}
                  >
                    <SafeIcon icon={item.icon} className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              ))}

              {/* 葬儀切り替え（モバイル） */}
              {funerals.length > 1 && (
                <div className="mt-4 pt-4 border-t border-funeral-200">
                  <p className="text-sm text-funeral-600 mb-2">葬儀切り替え</p>
                  {funerals.map((funeral) => (
                    <button
                      key={funeral.id}
                      onClick={() => {
                        handleFuneralSelect(funeral);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                        currentFuneral?.id === funeral.id
                          ? 'bg-funeral-100 text-funeral-800'
                          : 'text-funeral-600 hover:bg-funeral-50'
                      }`}
                    >
                      <p className="font-medium">{funeral.familyName}家</p>
                      {funeral.deceasedName && (
                        <p className="text-xs text-funeral-500">故 {funeral.deceasedName} 様</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* ドロップダウンクリック時の背景 */}
      {showFuneralDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFuneralDropdown(false)}
        />
      )}
    </>
  );
};

export default Navigation;