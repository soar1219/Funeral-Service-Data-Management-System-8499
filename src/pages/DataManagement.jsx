import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const { FiSearch, FiEdit3, FiTrash2, FiPlus, FiDownload, FiUpload, FiFilter, FiTag, FiUsers, FiBuilding } = FiIcons;

const DataManagement = () => {
  const { donations, searchDonations, updateDonation, deleteDonation, exportData, importData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDonations, setFilteredDonations] = useState(donations);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    lastName: '',
    firstName: '',
    fullName: '',
    relationship: '',
    address: '',
    amount: '',
    innerAmount: '',
    donationType: '',
    donationCategory: '',
    companyName: '',
    position: '',
    coNames: [],
    notes: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterByType, setFilterByType] = useState('');

  // ページネーション用 state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);

  useEffect(() => {
    let filtered = searchDonations(searchQuery);
    
    // 香典の種類でフィルター
    if (filterByType) {
      filtered = filtered.filter(donation =>
        donation.donationType === filterByType ||
        donation.donationtype === filterByType // snake_caseにも対応
      );
    }
    
    // ソート
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'amount') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredDonations(filtered);
  }, [searchQuery, donations, sortBy, sortOrder, filterByType]);

  useEffect(() => {
    setCurrentPage(1); // 検索やフィルタ変更時は1ページ目に戻す
  }, [searchQuery, donations, sortBy, sortOrder, filterByType]);

  const pagedDonations = filteredDonations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEdit = (donation) => {
    setSelectedDonation(donation);
    setEditForm({
      lastName: donation.lastName || '',
      firstName: donation.firstName || '',
      fullName: donation.fullName || donation.name || '',
      relationship: donation.relationship || '',
      address: donation.address || '',
      amount: donation.amount || '',
      innerAmount: donation.innerAmount || '',
      donationType: donation.donationType || '',
      donationCategory: donation.donationCategory || '',
      companyName: donation.companyName || '',
      position: donation.position || '',
      coNames: donation.coNames || [],
      notes: donation.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.fullName.trim() && !editForm.companyName.trim()) {
      toast.error('名前または会社名を入力してください');
      return;
    }

    updateDonation(selectedDonation.id, {
      ...editForm,
      donationType: editForm.donationType,
      donation_type: editForm.donationType, // 両方セット
      amount: parseInt(editForm.amount) || 0,
      innerAmount: parseInt(editForm.innerAmount) || 0,
      updatedAt: new Date().toISOString(),
      // 作成日時が未設定の場合のみセット
      createdAt: selectedDonation.createdAt || new Date().toISOString(),
    });
    
    setIsEditModalOpen(false);
    setSelectedDonation(null);
    toast.success('データを更新しました');
  };

  const handleDelete = (donation) => {
    const displayName = donation.fullName || donation.companyName || donation.name || '不明';
    if (window.confirm(`${displayName}の記録を削除しますか？`)) {
      deleteDonation(donation.id);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      importData(file);
    }
  };

  const addCoName = () => {
    setEditForm(prev => ({
      ...prev,
      coNames: [...prev.coNames, '']
    }));
  };

  const updateCoName = (index, value) => {
    setEditForm(prev => ({
      ...prev,
      coNames: prev.coNames.map((name, i) => i === index ? value : name)
    }));
  };

  const removeCoName = (index) => {
    setEditForm(prev => ({
      ...prev,
      coNames: prev.coNames.filter((_, i) => i !== index)
    }));
  };

  // 香典の種類の選択肢
  const donationTypes = [
    '御霊前', '御仏前', '御香典', '御香料', '御花料', 
    '御玉串料', '御榊料', '御供物料', '御弔慰料'
  ];

  // 香典の種類別統計
  const typeStats = donationTypes.reduce((stats, type) => {
    const typeData = filteredDonations.filter(d => d.donationType === type);
    if (typeData.length > 0) {
      stats[type] = {
        count: typeData.length,
        total: typeData.reduce((sum, d) => sum + (d.amount || 0), 0)
      };
    }
    return stats;
  }, {});

  const totalAmount = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-funeral-800 mb-2">データ管理</h1>
        <p className="text-funeral-600">香典記録の確認・編集・管理を行います</p>
      </motion.div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 香典の種類別統計 */}
        {Object.keys(typeStats).length > 0 && (
          <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-funeral-200 p-6">
            <h2 className="text-lg font-semibold text-funeral-800 mb-4 flex items-center">
              <SafeIcon icon={FiTag} className="mr-2" />
              香典の種類別統計
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(typeStats).map(([type, stats]) => (
                <div key={type} className="p-3 bg-funeral-50 rounded-lg border border-funeral-200">
                  <p className="text-sm font-medium text-funeral-700">{type}</p>
                  <p className="text-xs text-funeral-600">{stats.count}件</p>
                  <p className="text-sm font-semibold text-funeral-800">¥{stats.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 検索・フィルター・アクション */}
      <div className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 検索 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-funeral-400" />
              <input
                type="text"
                placeholder="名前、会社名、住所、続柄で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
              />
            </div>
          </div>

          {/* フィルター */}
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiFilter} className="text-funeral-400" />
            <select
              value={filterByType}
              onChange={(e) => setFilterByType(e.target.value)}
              className="px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
            >
              <option value="">全ての種類</option>
              {donationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* ソート */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
            >
              <option value="createdAt">作成日時</option>
              <option value="fullName">名前</option>
              <option value="companyName">会社名</option>
              <option value="amount">金額</option>
              <option value="donationType">種類</option>
              <option value="updatedAt">更新日時</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-funeral-600 hover:text-funeral-800 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* アクション */}
          <div className="flex items-center space-x-2">
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors"
            >
              <SafeIcon icon={FiDownload} />
              <span>エクスポート</span>
            </button>
            
            <label className="flex items-center space-x-2 px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors cursor-pointer">
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

        {/* 統計情報 */}
        <div className="mt-4 p-4 bg-funeral-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-funeral-600">
              表示中: {filteredDonations.length}件 / 全{donations.length}件
              {filterByType && ` (${filterByType}のみ)`}
            </span>
            <span className="text-funeral-600">
              合計金額: ¥{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* データテーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-funeral-200 overflow-hidden">
        {filteredDonations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-funeral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    種類
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    名前・会社名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    役職・続柄
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    住所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-funeral-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-funeral-200">
                {pagedDonations.map((donation) => (
                  <motion.tr
                    key={donation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-funeral-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donation.donationType || donation.donationtype ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {donation.donationType || donation.donationtype}
                        </span>
                      ) : (
                        <span className="text-funeral-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donation.companyName || donation.companyname ? (
                        <div>
                          <div className="flex items-center">
                            <SafeIcon icon={FiBuilding} className="text-funeral-400 mr-1 text-sm" />
                            <span className="font-medium text-funeral-800">{donation.companyName || donation.companyname}</span>
                          </div>
                          {(donation.fullName || donation.fullname || donation.name) && (
                            <div className="text-sm text-funeral-600 mt-1">{donation.fullName || donation.fullname || donation.name}</div>
                          )}
                        </div>
                      ) : (
                        <div className="font-medium text-funeral-800">
                          {donation.fullName || donation.fullname || donation.name || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-funeral-600">
                        {donation.position || donation.relationship || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-funeral-600 max-w-xs truncate">{donation.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-funeral-800">
                        ¥{(donation.amount ?? donation.amount ?? donation.amount) ? (donation.amount ?? donation.amount ?? 0).toLocaleString() : '-'}
                      </div>
                      {(() => {
                        const inner = donation.innerAmount ?? donation.inneramount;
                        const amount = donation.amount ?? donation.amount;
                        if (
                          inner &&
                          amount &&
                          inner !== amount
                        ) {
                          return (
                            <div className="text-xs text-funeral-500">
                              (中袋: ¥{inner.toLocaleString()})
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-funeral-600 text-sm">
                        {(() => {
                          const created = donation.createdAt || donation.createdat || donation.created_at;
                          if (!created) return '-';
                          const date = new Date(created);
                          if (isNaN(date.getTime())) return '-';
                          try {
                            return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
                          } catch {
                            return '-';
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(donation)}
                          className="p-2 text-funeral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <SafeIcon icon={FiEdit3} />
                        </button>
                        <button
                          onClick={() => handleDelete(donation)}
                          className="p-2 text-funeral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {/* ページャー: 10件以上の時のみ表示 */}
            {filteredDonations.length > itemsPerPage && (
              <div className="flex justify-center items-center py-4 space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-funeral-100 text-funeral-400 cursor-not-allowed' : 'bg-funeral-50 text-funeral-700 hover:bg-funeral-200'}`}
                >前へ</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${currentPage === page ? 'bg-funeral-600 text-white' : 'bg-funeral-50 text-funeral-700 hover:bg-funeral-200'}`}
                  >{page}</button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-funeral-100 text-funeral-400 cursor-not-allowed' : 'bg-funeral-50 text-funeral-700 hover:bg-funeral-200'}`}
                >次へ</button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiSearch} className="text-4xl text-funeral-300 mx-auto mb-4" />
            <p className="text-funeral-500 text-lg">データが見つかりません</p>
            <p className="text-funeral-400 text-sm mt-2">
              {searchQuery || filterByType ? '検索条件を変更してください' : 'まだデータが登録されていません'}
            </p>
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-funeral-800 mb-4">データ編集</h3>
            
            <div className="space-y-4">
              {/* 香典の種類 */}
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">香典の種類</label>
                <select
                  value={editForm.donationType || editForm.donationtype}
                  onChange={e => setEditForm({ ...editForm, donationType: e.target.value, donationtype: e.target.value })}
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                >
                  <option value="">選択してください</option>
                  {donationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 会社情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">会社名</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">役職</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
              </div>

              {/* 個人名 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">姓</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">名</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">フルネーム *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
              </div>

              {/* 連名 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-funeral-700">連名</label>
                  <button
                    onClick={addCoName}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <SafeIcon icon={FiPlus} className="text-xs" />
                    <span>追加</span>
                  </button>
                </div>
                {editForm.coNames.map((coName, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={coName}
                      onChange={(e) => updateCoName(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                      placeholder={`連名 ${index + 1}`}
                    />
                    <button
                      onClick={() => removeCoName(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <SafeIcon icon={FiTrash2} className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 続柄・住所 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">続柄・関係</label>
                  <input
                    type="text"
                    value={editForm.relationship}
                    onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">住所</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
              </div>

              {/* 金額 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">金額</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-funeral-700 mb-1">中袋金額</label>
                  <input
                    type="number"
                    value={editForm.innerAmount}
                    onChange={(e) => setEditForm({ ...editForm, innerAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                  />
                </div>
              </div>

              {/* 備考 */}
              <div>
                <label className="block text-sm font-medium text-funeral-700 mb-1">備考</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-funeral-600 border border-funeral-300 rounded-lg hover:bg-funeral-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-funeral-600 text-white rounded-lg hover:bg-funeral-700 transition-colors"
              >
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;