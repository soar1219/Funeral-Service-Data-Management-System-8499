import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import toast from 'react-hot-toast';

const { FiCloud, FiSmartphone, FiMonitor, FiRefreshCw, FiWifi, FiWifiOff, FiCheck, FiX, FiInfo } = FiIcons;

const SyncManager = () => {
  const {
    donations,
    settings,
    syncEnabled,
    lastSyncTime,
    isSyncing,
    supabaseConnected,
    enableSync,
    disableSync,
    syncFromCloud,
    syncToCloud
  } = useData();

  const [showDetails, setShowDetails] = useState(false);

  const handleEnableSync = async () => {
    const success = await enableSync();
    if (success) {
      toast.success('デバイス間でのデータ同期が有効になりました！');
    }
  };

  const handleDisableSync = () => {
    if (window.confirm('クラウド同期を無効にしますか？\n※ローカルデータは保持されます')) {
      disableSync();
    }
  };

  const handleManualSync = async () => {
    if (syncEnabled) {
      await syncFromCloud();
      await syncToCloud();
    }
  };

  // 同期統計
  const syncedCount = donations.filter(d => d.cloudSynced).length;
  const unsyncedCount = donations.length - syncedCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <SafeIcon icon={FiCloud} className="text-xl text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-funeral-800">デバイス間同期</h2>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-funeral-600 hover:text-funeral-800"
        >
          {showDetails ? '詳細を非表示' : '詳細を表示'}
        </button>
      </div>

      {/* 同期状態表示 */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border-2 ${
          syncEnabled 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <SafeIcon 
                icon={syncEnabled ? FiWifi : FiWifiOff} 
                className={`mr-2 ${syncEnabled ? 'text-green-600' : 'text-gray-500'}`} 
              />
              <span className="font-semibold text-funeral-800">
                {syncEnabled ? 'クラウド同期: 有効' : 'クラウド同期: 無効'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiSmartphone} className="text-funeral-500" />
              <SafeIcon icon={FiCloud} className="text-blue-500" />
              <SafeIcon icon={FiMonitor} className="text-funeral-500" />
            </div>
          </div>
          
          {syncEnabled ? (
            <div className="text-sm text-green-700">
              <p>✅ スマホとPCでデータが自動同期されます</p>
              {lastSyncTime && (
                <p className="mt-1">
                  最終同期: {format(new Date(lastSyncTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>❌ デバイス毎に個別のデータが保存されています</p>
              <p className="mt-1">同期を有効にすると、すべてのデバイスで同じデータを利用できます</p>
            </div>
          )}
        </div>
      </div>

      {/* 接続状態 */}
      <div className="mb-6">
        <h3 className="font-semibold text-funeral-700 mb-2">接続状態</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border ${
            supabaseConnected 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center">
              <SafeIcon 
                icon={supabaseConnected ? FiCheck : FiX} 
                className={`mr-2 ${supabaseConnected ? 'text-green-600' : 'text-red-600'}`} 
              />
              <span className="text-sm font-medium">
                データベース: {supabaseConnected ? '接続済み' : '未接続'}
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            syncEnabled 
              ? 'border-blue-200 bg-blue-50' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center">
              <SafeIcon 
                icon={syncEnabled ? FiCloud : FiWifiOff} 
                className={`mr-2 ${syncEnabled ? 'text-blue-600' : 'text-gray-500'}`} 
              />
              <span className="text-sm font-medium">
                同期: {syncEnabled ? '有効' : '無効'}
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            isSyncing 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-green-200 bg-green-50'
          }`}>
            <div className="flex items-center">
              <SafeIcon 
                icon={isSyncing ? FiRefreshCw : FiCheck} 
                className={`mr-2 ${isSyncing ? 'text-yellow-600 animate-spin' : 'text-green-600'}`} 
              />
              <span className="text-sm font-medium">
                状態: {isSyncing ? '同期中...' : '待機中'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 同期統計 */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <h3 className="font-semibold text-funeral-700 mb-2">同期統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">同期済み</span>
                <span className="font-semibold text-blue-800">{syncedCount}件</span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700">未同期</span>
                <span className="font-semibold text-orange-800">{unsyncedCount}件</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 操作ボタン */}
      <div className="space-y-3">
        {!syncEnabled ? (
          <div className="space-y-3">
            <button
              onClick={handleEnableSync}
              disabled={!supabaseConnected || isSyncing}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiCloud} />
              <span>デバイス間同期を有効にする</span>
            </button>
            
            {!supabaseConnected && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <SafeIcon icon={FiInfo} className="text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">データベース接続が必要です</p>
                    <p>同期機能を使用するには、Supabaseデータベースの設定が必要です。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>同期中...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiRefreshCw} />
                  <span>今すぐ同期</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDisableSync}
              className="w-full flex items-center justify-center space-x-2 text-red-600 border border-red-300 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
            >
              <SafeIcon icon={FiWifiOff} />
              <span>同期を無効にする</span>
            </button>
          </div>
        )}
      </div>

      {/* 使い方説明 */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h3 className="font-semibold text-blue-800 mb-2">💡 デバイス間同期について</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>自動同期</strong>: データを入力すると自動でクラウドに保存</li>
            <li>• <strong>リアルタイム同期</strong>: 他のデバイスからの変更も自動で反映</li>
            <li>• <strong>オフライン対応</strong>: ネットワークがない時はローカル保存</li>
            <li>• <strong>競合解決</strong>: 同じデータを複数デバイスで編集した場合は新しい方を採用</li>
            <li>• <strong>画像最適化</strong>: 画像はローカルのみ保存（容量節約）</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default SyncManager;