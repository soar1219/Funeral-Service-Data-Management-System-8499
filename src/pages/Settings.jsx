import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import SyncManager from '../components/SyncManager';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const { FiSettings, FiSave, FiTrash2, FiDownload, FiUpload, FiRefreshCw } = FiIcons;

const Settings = () => {
  const { settings, saveSettings, donations, exportData, importData, loadData, currentFuneral } = useData();
  const [formData, setFormData] = useState({
    funeralHomeName: settings.funeralHomeName || '',
    address: settings.address || '',
    phone: settings.phone || '',
    autoSave: settings.autoSave || true,
    ocrLanguage: settings.ocrLanguage || 'jpn'
  });
  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    saveSettings(formData);
  };

  const handleClearAllData = () => {
    if (window.confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      if (window.confirm('本当にすべてのデータを削除しますか？')) {
        localStorage.removeItem('funeral-donations');
        loadData();
        toast.success('すべてのデータを削除しました');
      }
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      importData(file);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('設定をリセットしますか？')) {
      const defaultSettings = {
        funeralHomeName: '葬儀場名',
        address: '住所',
        phone: '電話番号',
        autoSave: true,
        ocrLanguage: 'jpn'
      };
      setFormData(defaultSettings);
      saveSettings(defaultSettings);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-funeral-800 mb-2">設定</h1>
        <p className="text-funeral-600">システムの設定を管理します</p>
      </motion.div>

      <div className="space-y-6">
        {/* デバイス間同期設定 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SyncManager />
        </motion.div>

        {/* 基本設定 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiSettings} className="text-xl text-funeral-600 mr-2" />
            <h2 className="text-xl font-semibold text-funeral-800">基本設定</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-funeral-700 mb-2">葬儀場名</label>
              <input
                type="text"
                value={formData.funeralHomeName}
                onChange={(e) => handleInputChange('funeralHomeName', e.target.value)}
                className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                placeholder="葬儀場名を入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-funeral-700 mb-2">電話番号</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                placeholder="電話番号を入力"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-funeral-700 mb-2">住所</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                placeholder="住所を入力"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoSave}
                onChange={(e) => handleInputChange('autoSave', e.target.checked)}
                className="mr-2 h-4 w-4 text-funeral-600 focus:ring-funeral-500 border-funeral-300 rounded"
              />
              <span className="text-sm text-funeral-700">自動保存を有効にする</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-funeral-700 mb-2">OCR言語設定</label>
            <select
              value={formData.ocrLanguage}
              onChange={(e) => handleInputChange('ocrLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
            >
              <option value="jpn">日本語</option>
              <option value="eng">英語</option>
              <option value="jpn+eng">日本語 + 英語</option>
            </select>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleResetSettings}
              className="flex items-center space-x-2 px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors"
            >
              <SafeIcon icon={FiRefreshCw} />
              <span>設定をリセット</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-funeral-600 text-white px-6 py-2 rounded-lg hover:bg-funeral-700 transition-colors"
            >
              <SafeIcon icon={FiSave} />
              <span>保存</span>
            </button>
          </div>
        </motion.div>

        {/* データ管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-semibold text-funeral-800 mb-4">データ管理</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-funeral-200 rounded-lg">
              <h3 className="font-semibold text-funeral-700 mb-2">データエクスポート</h3>
              <p className="text-sm text-funeral-600 mb-3">
                全データをJSONファイルとしてエクスポートします
              </p>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiDownload} />
                <span>エクスポート</span>
              </button>
            </div>
            
            <div className="p-4 border border-funeral-200 rounded-lg">
              <h3 className="font-semibold text-funeral-700 mb-2">データインポート</h3>
              <p className="text-sm text-funeral-600 mb-3">
                JSONファイルからデータをインポートします
              </p>
              <label className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <SafeIcon icon={FiUpload} />
                <span>インポート</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 p-4 bg-funeral-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-funeral-700">現在のデータ</p>
                <p className="text-xs text-funeral-600">
                  {donations.length}件の記録が保存されています
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-funeral-700">
                  合計金額: ¥{donations.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 危険な操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-red-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-red-800">危険な操作</h2>
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              {showDangerZone ? '非表示' : '表示'}
            </button>
          </div>

          {showDangerZone && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">現在の葬儀データ削除</h3>
                {currentFuneral ? (
                  <>
                    <p className="text-sm text-red-700 mb-2">
                      「{currentFuneral.familyName || '(家名未登録)'}家{currentFuneral.deceasedName ? `（故 ${currentFuneral.deceasedName} 様）` : ''}」の香典記録をすべて削除します。この操作は取り消せません。
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('本当にこの葬儀の全データを削除しますか？この操作は取り消せません。')) {
                          const allDonations = JSON.parse(localStorage.getItem('funeral-donations') || '[]');
                          const filtered = allDonations.filter(d => d.funeralId !== currentFuneral.id);
                          localStorage.setItem('funeral-donations', JSON.stringify(filtered));
                          loadData();
                          toast.success('現在の葬儀データを削除しました');
                        }
                      }}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <SafeIcon icon={FiTrash2} />
                      <span>現在の葬儀データ削除</span>
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-red-700">現在の葬儀が選択されていません。</p>
                )}
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">注意事項</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• データは全てブラウザのローカルストレージに保存されます</li>
                  <li>• ブラウザのデータを削除するとすべての記録が失われます</li>
                  <li>• 定期的にデータをエクスポートしてバックアップを取ることを推奨します</li>
                  <li>• デバイス間同期を有効にすると、クラウドにもデータが保存されます</li>
                </ul>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* システム情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-semibold text-funeral-800 mb-4">システム情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-funeral-600">システム名</p>
              <p className="font-medium text-funeral-800">香典記録システム</p>
            </div>
            <div>
              <p className="text-funeral-600">バージョン</p>
              <p className="font-medium text-funeral-800">1.1.0</p>
            </div>
            <div>
              <p className="text-funeral-600">ブラウザ</p>
              <p className="font-medium text-funeral-800">{navigator.userAgent.split(' ')[0]}</p>
            </div>
            <div>
              <p className="text-funeral-600">ストレージ使用量</p>
              <p className="font-medium text-funeral-800">
                {Math.round(JSON.stringify(donations).length / 1024)}KB
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;