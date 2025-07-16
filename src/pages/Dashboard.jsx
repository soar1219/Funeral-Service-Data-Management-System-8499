import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import toast from 'react-hot-toast';

const {
  FiCamera,
  FiDatabase,
  FiPrinter,
  FiUsers,
  FiDollarSign,
  FiBuilding,
  FiPlus,
  FiArrowRight,
  FiHome,
  FiEdit3,
  FiTrash2,
  FiMoreVertical
} = FiIcons;

const Dashboard = () => {
  const { 
    funerals, 
    currentFuneral, 
    donations, 
    settings, 
    createFuneral, 
    updateFuneral,
    deleteFuneral,
    switchToFuneral 
  } = useData();
  
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    personalCount: 0,
    corporateCount: 0
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFuneral, setEditingFuneral] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  
  const [newFuneralForm, setNewFuneralForm] = useState({
    familyName: '',
    deceasedName: '',
    relationship: '',
    funeralDate: '',
    venue: '',
    notes: ''
  });

  const [editFuneralForm, setEditFuneralForm] = useState({
    familyName: '',
    deceasedName: '',
    relationship: '',
    funeralDate: '',
    venue: '',
    notes: ''
  });

  useEffect(() => {
    calculateStats();
  }, [donations]);

  const calculateStats = () => {
    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const personalDonations = donations.filter(d => !d.companyName);
    const corporateDonations = donations.filter(d => d.companyName);

    setStats({
      totalDonations: donations.length,
      totalAmount,
      personalCount: personalDonations.length,
      corporateCount: corporateDonations.length
    });
  };

  const handleCreateFuneral = async () => {
    if (!newFuneralForm.familyName.trim()) {
      toast.error('家名を入力してください');
      return;
    }

    try {
      await createFuneral(newFuneralForm);
      setShowCreateModal(false);
      setNewFuneralForm({
        familyName: '',
        deceasedName: '',
        relationship: '',
        funeralDate: '',
        venue: '',
        notes: ''
      });
    } catch (error) {
      console.error('葬儀作成エラー:', error);
    }
  };

  const handleEditFuneral = (funeral) => {
    setEditingFuneral(funeral);
    setEditFuneralForm({
      familyName: funeral.familyName || '',
      deceasedName: funeral.deceasedName || '',
      relationship: funeral.relationship || '',
      funeralDate: funeral.funeralDate || '',
      venue: funeral.venue || '',
      notes: funeral.notes || ''
    });
    setShowEditModal(true);
    setShowDropdown(null);
  };

  const handleUpdateFuneral = async () => {
    if (!editFuneralForm.familyName.trim()) {
      toast.error('家名を入力してください');
      return;
    }

    try {
      await updateFuneral(editingFuneral.id, editFuneralForm);
      setShowEditModal(false);
      setEditingFuneral(null);
      toast.success('葬儀情報を更新しました');
    } catch (error) {
      console.error('葬儀更新エラー:', error);
      toast.error('葬儀情報の更新に失敗しました');
    }
  };

  const handleDeleteFuneral = (funeral) => {
    const confirmMessage = `${funeral.familyName}家の葬儀を削除しますか？\n\n注意: この操作により、関連する香典記録もすべて削除されます。\nこの操作は取り消せません。`;
    
    if (window.confirm(confirmMessage)) {
      if (window.confirm('本当に削除しますか？この操作は取り消せません。')) {
        try {
          deleteFuneral(funeral.id);
          setShowDropdown(null);
          toast.success(`${funeral.familyName}家の葬儀を削除しました`);
        } catch (error) {
          console.error('葬儀削除エラー:', error);
          toast.error('葬儀の削除に失敗しました');
        }
      }
    }
  };

  const recentDonations = donations
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const quickActions = [
    {
      title: 'OCR入力',
      description: '香典袋をスキャンして自動入力',
      icon: FiCamera,
      link: '/ocr',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      disabled: !currentFuneral
    },
    {
      title: 'データ管理',
      description: '記録の確認・編集・検索',
      icon: FiDatabase,
      link: '/data',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      disabled: !currentFuneral
    },
    {
      title: '印刷・出力',
      description: '帳票作成・印刷',
      icon: FiPrinter,
      link: '/print',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      disabled: !currentFuneral
    }
  ];

  const statCards = [
    {
      title: '総記録数',
      value: stats.totalDonations,
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '総額',
      value: `¥${stats.totalAmount.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-funeral-800 mb-2">ダッシュボード</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-funeral-600 text-white px-4 py-2 rounded-lg hover:bg-funeral-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>新しい葬儀</span>
          </button>
        </div>
      </motion.div>

      {/* 現在の葬儀表示 */}
      {currentFuneral ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-funeral-600 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiHome} className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-funeral-800">
                  {(currentFuneral.familyName && currentFuneral.familyName.trim()) ? `${currentFuneral.familyName}家` : '家名未設定'}
                </h2>
                {currentFuneral.deceasedName && (
                  <p className="text-funeral-600">故 {currentFuneral.deceasedName} 様</p>
                )}
                {currentFuneral.venue && (
                  <p className="text-sm text-funeral-500">{currentFuneral.venue}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-funeral-600">香典記録</p>
              <p className="text-2xl font-bold text-funeral-800">{donations.length}件</p>
              <p className="text-lg text-funeral-600">¥{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8"
        >
          <div className="text-center">
            <SafeIcon icon={FiHome} className="text-4xl text-yellow-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-yellow-800 mb-2">葬儀が選択されていません</h2>
            <p className="text-yellow-700 mb-4">
              香典記録を開始するには、まず葬儀を作成または選択してください
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              葬儀を作成
            </button>
          </div>
        </motion.div>
      )}

      {/* 統計カード（現在の葬儀のみ） */}
      {currentFuneral && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${card.bgColor} rounded-xl p-6 shadow-sm border border-funeral-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-funeral-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-funeral-800">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color} bg-white`}>
                  <SafeIcon icon={card.icon} className="text-xl" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* クイックアクション */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-bold text-funeral-800 mb-4">クイックアクション</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              action.disabled ? (
                <div
                  key={action.title}
                  className="block p-4 rounded-lg bg-gray-100 text-gray-400 opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={action.icon} className="text-xl" />
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm">葬儀を選択してください</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={action.title}
                  to={action.link}
                  className={`block p-4 rounded-lg ${action.color} ${action.hoverColor} text-white transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={action.icon} className="text-xl" />
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        </motion.div>

        {/* 最近の記録 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-funeral-800">最近の記録</h2>
            {currentFuneral && (
              <Link
                to="/data"
                className="text-sm text-funeral-600 hover:text-funeral-800 transition-colors"
              >
                すべて表示
              </Link>
            )}
          </div>
          {currentFuneral && recentDonations.length > 0 ? (
            <div className="space-y-3">
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-funeral-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      {donation.companyName || donation.companyname ? (
                        <>
                          <SafeIcon icon={FiBuilding} className="text-funeral-400 text-sm" />
                          <p className="font-medium text-funeral-800">
                            {donation.companyName || donation.companyname}
                          </p>
                          {(donation.fullName || donation.fullname || donation.name) && (
                            <span className="ml-2 text-sm text-funeral-600">{donation.fullName || donation.fullname || donation.name}</span>
                          )}
                        </>
                      ) : (
                        <p className="font-medium text-funeral-800">
                          {donation.fullName || donation.fullname || donation.name || '-'}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-funeral-600">
                      {donation.position || donation.relationship}
                    </p>
                    {donation.coNames && donation.coNames.length > 0 && (
                      <p className="text-xs text-funeral-500">
                        連名: {donation.coNames.slice(0, 2).join(',')}
                        {donation.coNames.length > 2 && ` 他${donation.coNames.length - 2}名`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-funeral-800">
                      ¥{donation.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-funeral-500">
                      {(() => {
                        if (!donation.createdAt) return '-';
                        const date = new Date(donation.createdAt);
                        if (isNaN(date.getTime())) return '-';
                        try {
                          return format(date, 'MM/dd HH:mm');
                        } catch {
                          return '-';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiDatabase} className="text-4xl text-funeral-300 mx-auto mb-2" />
              <p className="text-funeral-500">
                {currentFuneral ? 'まだ記録がありません' : '葬儀を選択してください'}
              </p>
              {currentFuneral && (
                <Link
                  to="/ocr"
                  className="inline-block mt-2 text-funeral-600 hover:text-funeral-800 transition-colors"
                >
                  最初の記録を追加
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* 葬儀一覧 */}
      {funerals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <h2 className="text-xl font-bold text-funeral-800 mb-4">葬儀一覧</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {funerals.map((funeral) => (
              <div
                key={funeral.id}
                className={`p-4 rounded-lg border transition-all relative ${
                  currentFuneral?.id === funeral.id
                    ? 'border-funeral-500 bg-funeral-50'
                    : 'border-funeral-200 hover:border-funeral-300 hover:bg-funeral-50'
                }`}
              >
                {/* メインクリックエリア */}
                <div
                  onClick={() => switchToFuneral(funeral)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-funeral-800">{(funeral.familyName && funeral.familyName.trim()) ? `${funeral.familyName}家` : '家名未設定'}</h3>
                    {funeral.deceasedName && (
                      <p className="text-sm text-funeral-600">故 {funeral.deceasedName} 様</p>
                    )}
                    {(() => {
                      if (!funeral.funeralDate) return null;
                      const date = new Date(funeral.funeralDate);
                      if (isNaN(date.getTime())) {
                        return <p className="text-xs text-funeral-500">-</p>;
                      }
                      try {
                        return (
                          <p className="text-xs text-funeral-500">
                            {format(date, 'MM/dd', { locale: ja })}
                          </p>
                        );
                      } catch {
                        return <p className="text-xs text-funeral-500">-</p>;
                      }
                    })()}
                    {funeral.venue && (
                      <p className="text-xs text-funeral-500">{funeral.venue}</p>
                    )}
                  </div>
                  <SafeIcon icon={FiArrowRight} className="text-funeral-400" />
                </div>

                {/* アクションメニュー */}
                <div className="absolute top-2 right-2">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(showDropdown === funeral.id ? null : funeral.id);
                      }}
                      className="p-1 text-funeral-400 hover:text-funeral-600 hover:bg-funeral-100 rounded transition-colors"
                    >
                      <SafeIcon icon={FiMoreVertical} className="text-sm" />
                    </button>

                    {showDropdown === funeral.id && (
                      <div className="absolute top-full right-0 mt-1 bg-white border border-funeral-200 rounded-lg shadow-lg z-10 min-w-32">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFuneral(funeral);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-funeral-700 hover:bg-funeral-50 transition-colors"
                          >
                            <SafeIcon icon={FiEdit3} className="text-xs" />
                            <span>編集</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFuneral(funeral);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <SafeIcon icon={FiTrash2} className="text-xs" />
                            <span>削除</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 葬儀作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-funeral-800 mb-4">新しい葬儀の作成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  家名 *
                </label>
                <input
                  type="text"
                  value={newFuneralForm.familyName}
                  onChange={(e) => setNewFuneralForm({ ...newFuneralForm, familyName: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="田中"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  故人名
                </label>
                <input
                  type="text"
                  value={newFuneralForm.deceasedName}
                  onChange={(e) => setNewFuneralForm({ ...newFuneralForm, deceasedName: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="田中太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  葬儀日
                </label>
                <input
                  type="date"
                  value={newFuneralForm.funeralDate}
                  onChange={(e) => setNewFuneralForm({ ...newFuneralForm, funeralDate: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  会場
                </label>
                <input
                  type="text"
                  value={newFuneralForm.venue}
                  onChange={(e) => setNewFuneralForm({ ...newFuneralForm, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="○○会館"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateFuneral}
                className="px-4 py-2 bg-funeral-600 text-white rounded-lg hover:bg-funeral-700 transition-colors"
              >
                作成
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 葬儀編集モーダル */}
      {showEditModal && editingFuneral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-funeral-800 mb-4">
              {editingFuneral.familyName}家の葬儀情報編集
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  家名 *
                </label>
                <input
                  type="text"
                  value={editFuneralForm.familyName}
                  onChange={(e) => setEditFuneralForm({ ...editFuneralForm, familyName: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="田中"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  故人名
                </label>
                <input
                  type="text"
                  value={editFuneralForm.deceasedName}
                  onChange={(e) => setEditFuneralForm({ ...editFuneralForm, deceasedName: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="田中太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  葬儀日
                </label>
                <input
                  type="date"
                  value={editFuneralForm.funeralDate}
                  onChange={(e) => setEditFuneralForm({ ...editFuneralForm, funeralDate: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  会場
                </label>
                <input
                  type="text"
                  value={editFuneralForm.venue}
                  onChange={(e) => setEditFuneralForm({ ...editFuneralForm, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="○○会館"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">
                  備考
                </label>
                <textarea
                  value={editFuneralForm.notes}
                  onChange={(e) => setEditFuneralForm({ ...editFuneralForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  placeholder="備考を入力"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFuneral(null);
                }}
                className="px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateFuneral}
                className="px-4 py-2 bg-funeral-600 text-white rounded-lg hover:bg-funeral-700 transition-colors"
              >
                更新
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ドロップダウン外クリック用背景 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;