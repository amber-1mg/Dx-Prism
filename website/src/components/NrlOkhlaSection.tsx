import React, { useState } from 'react';
import { 
  Search, 
  Calendar,
  Database,
  Inbox,
  ArrowUpDown
} from 'lucide-react';
import { NRL_OKHLA_DATA, NrlOkhlaItem } from '../constants/nrlOkhlaData';

export const NrlOkhlaSection: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'testName' | 'skuId' | 'doseCode' | 'runDay'>('testName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleCount, setVisibleCount] = useState(15);

  const handleSort = (field: 'testName' | 'skuId' | 'doseCode' | 'runDay') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Sort core items based ONLY on search term
  const filteredItems = NRL_OKHLA_DATA
    .filter(item => {
      const matchSearch = 
        item.testName.toLowerCase().includes(search.toLowerCase()) ||
        item.skuId.includes(search) ||
        item.doseCode.toLowerCase().includes(search.toLowerCase()) ||
        item.runDay.toLowerCase().includes(search.toLowerCase()) ||
        item.newDelhi.toLowerCase().includes(search.toLowerCase());
      
      return matchSearch;
    })
    .sort((a, b) => {
      let valA = a[sortField].toString().toLowerCase();
      let valB = b[sortField].toString().toLowerCase();
      
      if (sortField === 'skuId') {
        const intA = parseInt(a.skuId) || 0;
        const intB = parseInt(b.skuId) || 0;
        return sortDirection === 'asc' ? intA - intB : intB - intA;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <section className="bg-white border border-slate-150 rounded-[2.5rem] p-6 sm:p-10 mb-12 shadow-sm" id="nrl-okhla">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#ff6f61]/10 p-2 rounded-xl text-[#ff6f61]">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-[#ff6f61] uppercase tracking-[0.2em]">Diagnostics Reference Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Run Day-NRL, OKhla</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse and query the comprehensive Okhla clinical department diagnostics calendar.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400 animate-none" />
          <span>LAST UPDATED: 2026-06-16</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search schedule by test name, SKU ID, DOSE code or run day..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-[#ff6f61] rounded-2xl text-xs font-medium focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Database Grid Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          {filteredItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Inbox className="w-12 h-12 text-slate-205 mb-3" />
              <h4 className="text-sm font-black text-slate-800">No matching records</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                No clinical diagnostic test matched your search keywords.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <table className="w-full text-left border-collapse hidden sm:table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-mono">
                    <th 
                      onClick={() => handleSort('skuId')}
                      className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 rounded-l-xl transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        SKU ID
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('doseCode')}
                      className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        CODE
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('testName')}
                      className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors w-[50%]"
                    >
                      <div className="flex items-center gap-1">
                        SKU / TEST NAME
                        <ArrowUpDown className="w-3 h-3 text-[#ff6f61]" />
                      </div>
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">NEW DELHI</th>
                    <th 
                      onClick={() => handleSort('runDay')}
                      className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 rounded-r-xl transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        RUN DAY
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.slice(0, visibleCount).map((item, index) => (
                    <tr 
                      key={`${item.skuId}-${index}`} 
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-mono"
                    >
                      <td className="p-4 text-xs font-semibold text-slate-500">{item.skuId || '-'}</td>
                      <td className="p-4 text-xs font-semibold text-slate-400">{item.doseCode}</td>
                      <td className="p-4 text-xs font-black text-slate-850 truncate max-w-[280px]" title={item.testName}>
                        {item.testName}
                      </td>
                      <td className="p-4 text-xs font-black">
                        <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest uppercase ${
                          item.newDelhi === 'Inhouse' 
                            ? 'bg-[#ff6f61]/10 text-[#ff6f61] border border-[#ff6f61]/20' 
                            : 'bg-blue-55 text-blue-600 border border-blue-100'
                        }`}>
                          {item.newDelhi}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-600">{item.runDay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile View Card List */}
              <div className="sm:hidden divide-y divide-slate-100">
                {filteredItems.slice(0, visibleCount).map((item, index) => (
                  <div 
                    key={`${item.skuId}-mobile-${index}`}
                    className="p-4 bg-white font-mono space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#ff6f61] bg-[#ff6f61]/10 px-1.5 py-0.5 rounded">
                        SKU: {item.skuId || '-'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.doseCode}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                      {item.testName}
                    </h4>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-550">
                      <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        item.newDelhi === 'Inhouse' ? 'bg-[#ff6f61]/10 text-[#ff6f61]' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.newDelhi}
                      </span>
                      <span className="font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0 text-slate-400" />
                        {item.runDay}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Table Pagination / Load More Footer */}
        {filteredItems.length > visibleCount && (
          <div className="pt-4 flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Showing {Math.min(visibleCount, filteredItems.length)} of {filteredItems.length} records
            </p>
            <button 
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="px-5 py-2 hover:bg-slate-50 text-slate-850 text-[10px] font-black tracking-widest uppercase border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm"
            >
              Load More Records
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
