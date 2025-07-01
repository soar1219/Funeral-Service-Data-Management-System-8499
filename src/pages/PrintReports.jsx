import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const { FiPrinter, FiDownload, FiFileText, FiCalendar, FiDollarSign, FiUsers } = FiIcons;

const PrintReports = () => {
  const { donations, settings } = useData();
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const filterDonations = () => {
    let filtered = [...donations];
    
    if (dateRange.start) {
      filtered = filtered.filter(d => 
        new Date(d.createdAt) >= new Date(dateRange.start)
      );
    }
    
    if (dateRange.end) {
      filtered = filtered.filter(d => 
        new Date(d.createdAt) <= new Date(dateRange.end + 'T23:59:59')
      );
    }
    
    return filtered;
  };

  // 名前を取得するヘルパー関数
  const getDisplayName = (donation) => {
    if (donation.companyName) {
      return donation.fullName ? 
        `${donation.companyName} ${donation.fullName}` : 
        donation.companyName;
    }
    return donation.fullName || donation.name || '不明';
  };

  const generatePDF = async (type) => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const filteredData = filterDonations();
      
      // 日本語フォント設定（代替手段）
      doc.setFont('helvetica');
      
      // ヘッダー
      doc.setFontSize(18);
      doc.text(settings.funeralHomeName || '葬儀場', 20, 20);
      doc.setFontSize(12);
      doc.text(`${settings.address || ''}`, 20, 30);
      doc.text(`${settings.phone || ''}`, 20, 40);
      
      doc.setFontSize(16);
      const reportTitle = type === 'summary' ? 'Koden Summary Report' : 'Koden Detail Report';
      doc.text(reportTitle, 20, 60);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 70);
      
      if (type === 'summary') {
        // サマリーレポート
        const totalAmount = filteredData.reduce((sum, d) => sum + (d.amount || 0), 0);
        const averageAmount = filteredData.length > 0 ? totalAmount / filteredData.length : 0;
        
        doc.text(`Total Records: ${filteredData.length}`, 20, 90);
        doc.text(`Total Amount: ¥${totalAmount.toLocaleString()}`, 20, 100);
        doc.text(`Average Amount: ¥${Math.round(averageAmount).toLocaleString()}`, 20, 110);
        
        // 金額別集計
        const amountRanges = [
          { min: 0, max: 5000, label: '~¥5,000' },
          { min: 5000, max: 10000, label: '¥5,000-10,000' },
          { min: 10000, max: 30000, label: '¥10,000-30,000' },
          { min: 30000, max: Infinity, label: '¥30,000+' }
        ];
        
        doc.text('Amount Distribution:', 20, 130);
        amountRanges.forEach((range, index) => {
          const count = filteredData.filter(d => 
            d.amount >= range.min && d.amount < range.max
          ).length;
          doc.text(`${range.label}: ${count} records`, 30, 140 + (index * 10));
        });
        
      } else {
        // 詳細レポート
        const tableData = filteredData.map(d => [
          d.companyName || '',
          d.fullName || d.name || '',
          d.position || d.relationship || '',
          d.address || '',
          `¥${(d.amount || 0).toLocaleString()}`,
          format(new Date(d.createdAt), 'yyyy-MM-dd', { locale: ja })
        ]);
        
        doc.autoTable({
          head: [['Company', 'Name', 'Position/Relationship', 'Address', 'Amount', 'Date']],
          body: tableData,
          startY: 80,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [108, 117, 125] },
          alternateRowStyles: { fillColor: [248, 249, 250] }
        });
        
        // 合計を追加
        const finalY = doc.lastAutoTable.finalY + 10;
        const totalAmount = filteredData.reduce((sum, d) => sum + (d.amount || 0), 0);
        doc.setFontSize(12);
        doc.text(`Total: ¥${totalAmount.toLocaleString()}`, 20, finalY);
      }
      
      // PDF保存
      const fileName = `koden_${type}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCSV = () => {
    const filteredData = filterDonations();
    
    const csvContent = [
      ['Company Name', 'Full Name', 'Position', 'Relationship', 'Address', 'Amount', 'Inner Amount', 'Donation Type', 'Co-Names', 'Notes', 'Created Date'].join(','),
      ...filteredData.map(d => [
        `"${d.companyName || ''}"`,
        `"${d.fullName || d.name || ''}"`,
        `"${d.position || ''}"`,
        `"${d.relationship || ''}"`,
        `"${d.address || ''}"`,
        d.amount || 0,
        d.innerAmount || 0,
        `"${d.donationType || ''}"`,
        `"${d.coNames ? d.coNames.join(', ') : ''}"`,
        `"${d.notes || ''}"`,
        format(new Date(d.createdAt), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `koden_data_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  const printPreview = () => {
    const filteredData = filterDonations();
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>香典記録一覧</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
          .company-name { color: #0066cc; font-weight: bold; }
          .person-name { color: #333; }
          .co-names { color: #666; font-size: 11px; }
          .empty-cell { color: #999; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            th, td { font-size: 10px; padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.funeralHomeName || '葬儀場'}</h1>
          <p>${settings.address || ''}</p>
          <p>${settings.phone || ''}</p>
          <p>香典記録一覧 - ${format(new Date(), 'yyyy年MM月dd日', { locale: ja })}</p>
          ${dateRange.start || dateRange.end ? 
            `<p>期間: ${dateRange.start || '開始日なし'} ～ ${dateRange.end || '終了日なし'}</p>` : 
            '<p>期間: 全期間</p>'
          }
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">会社名</th>
              <th style="width: 15%;">氏名</th>
              <th style="width: 12%;">役職・続柄</th>
              <th style="width: 23%;">住所</th>
              <th style="width: 10%;">香典種類</th>
              <th style="width: 12%;">金額</th>
              <th style="width: 8%;">日付</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(d => {
              const coNamesText = d.coNames && d.coNames.length > 0 ? 
                `<br><span class="co-names">連名: ${d.coNames.join(', ')}</span>` : '';
              
              return `
                <tr>
                  <td>
                    ${d.companyName ? 
                      `<span class="company-name">${d.companyName}</span>` : 
                      '<span class="empty-cell">-</span>'
                    }
                  </td>
                  <td>
                    ${d.fullName || d.name ? 
                      `<span class="person-name">${d.fullName || d.name}</span>${coNamesText}` : 
                      '<span class="empty-cell">-</span>'
                    }
                  </td>
                  <td>
                    ${d.position || d.relationship ? 
                      `${d.position || d.relationship}` : 
                      '<span class="empty-cell">-</span>'
                    }
                  </td>
                  <td>
                    ${d.address ? 
                      `${d.address}` : 
                      '<span class="empty-cell">-</span>'
                    }
                  </td>
                  <td>
                    ${d.donationType ? 
                      `${d.donationType}` : 
                      '<span class="empty-cell">-</span>'
                    }
                  </td>
                  <td style="text-align: right;">
                    ¥${(d.amount || 0).toLocaleString()}
                    ${d.innerAmount && d.innerAmount !== d.amount ? 
                      `<br><small>(中袋: ¥${d.innerAmount.toLocaleString()})</small>` : ''
                    }
                  </td>
                  <td>${format(new Date(d.createdAt), 'MM/dd', { locale: ja })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <p>総件数: ${filteredData.length}件</p>
          <p>合計金額: ¥${filteredData.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}</p>
        </div>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">印刷</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">閉じる</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredData = filterDonations();
  const totalAmount = filteredData.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-funeral-800 mb-2">印刷・出力</h1>
        <p className="text-funeral-600">香典記録の帳票作成・印刷・エクスポートを行います</p>
      </motion.div>

      {/* フィルター設定 */}
      <div className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-funeral-800 mb-4">出力設定</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-funeral-700 mb-2">開始日</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-funeral-700 mb-2">終了日</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-funeral-300 rounded-lg focus:ring-2 focus:ring-funeral-500 focus:border-funeral-500"
            />
          </div>
        </div>

        {/* プレビュー統計 */}
        <div className="mt-4 p-4 bg-funeral-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <SafeIcon icon={FiUsers} className="text-2xl text-funeral-600 mx-auto mb-1" />
              <p className="text-sm text-funeral-600">対象件数</p>
              <p className="text-lg font-semibold text-funeral-800">{filteredData.length}件</p>
            </div>
            <div>
              <SafeIcon icon={FiDollarSign} className="text-2xl text-funeral-600 mx-auto mb-1" />
              <p className="text-sm text-funeral-600">合計金額</p>
              <p className="text-lg font-semibold text-funeral-800">¥{totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <SafeIcon icon={FiCalendar} className="text-2xl text-funeral-600 mx-auto mb-1" />
              <p className="text-sm text-funeral-600">期間</p>
              <p className="text-lg font-semibold text-funeral-800">
                {dateRange.start && dateRange.end
                  ? `${dateRange.start} - ${dateRange.end}`
                  : '全期間'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 出力オプション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 印刷プレビュー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon icon={FiPrinter} className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-funeral-800 mb-2">印刷プレビュー</h3>
            <p className="text-sm text-funeral-600 mb-4">
              ブラウザの印刷機能を使用して一覧を印刷します
            </p>
            <button
              onClick={printPreview}
              disabled={filteredData.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              印刷プレビュー
            </button>
          </div>
        </motion.div>

        {/* PDF詳細レポート */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon icon={FiFileText} className="text-2xl text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-funeral-800 mb-2">PDF詳細レポート</h3>
            <p className="text-sm text-funeral-600 mb-4">
              全データを含む詳細なPDFレポートを生成します
            </p>
            <button
              onClick={() => generatePDF('detail')}
              disabled={filteredData.length === 0 || isGenerating}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中...' : 'PDF生成'}
            </button>
          </div>
        </motion.div>

        {/* PDFサマリーレポート */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon icon={FiFileText} className="text-2xl text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-funeral-800 mb-2">PDFサマリー</h3>
            <p className="text-sm text-funeral-600 mb-4">
              統計情報を含むサマリーレポートを生成します
            </p>
            <button
              onClick={() => generatePDF('summary')}
              disabled={filteredData.length === 0 || isGenerating}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中...' : 'PDF生成'}
            </button>
          </div>
        </motion.div>

        {/* CSVエクスポート */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon icon={FiDownload} className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-funeral-800 mb-2">CSVエクスポート</h3>
            <p className="text-sm text-funeral-600 mb-4">
              Excel等で利用可能なCSVファイルを出力します
            </p>
            <button
              onClick={generateCSV}
              disabled={filteredData.length === 0}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CSV出力
            </button>
          </div>
        </motion.div>
      </div>

      {/* データなしの場合の表示 */}
      {filteredData.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-funeral-200 p-8 text-center mt-6"
        >
          <SafeIcon icon={FiFileText} className="text-4xl text-funeral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-funeral-800 mb-2">出力データがありません</h3>
          <p className="text-funeral-600">
            {donations.length === 0 
              ? 'まだデータが登録されていません。' 
              : '指定した期間にデータがありません。期間を変更してください。'
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default PrintReports;