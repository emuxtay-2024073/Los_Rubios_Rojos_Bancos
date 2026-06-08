import React, { useState } from 'react';
import { Input } from './Input.jsx';
import { Button } from './Button.jsx';
import { Badge } from './Badge.jsx';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export const DataTable = ({ 
  columns, 
  data, 
  className = '',
  searchable = true,
  filterable = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter((row) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = columns.some((column) => {
        const value = row[column.key];
        return String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // Column filters
    for (const [key, value] of Object.entries(filters)) {
      if (value && String(row[key]) !== value) {
        return false;
      }
    }

    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getUniqueValues = (key) => {
    return [...new Set(data.map((row) => row[key]))];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
          {searchable && (
            <div className='search-input relative w-full sm:w-80'>
              <Input
                placeholder='Buscar...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          {filterable && (
            <div className='flex gap-2 flex-wrap'>
              {columns.map((column) => (
                column.filterable && (
                  <select
                    key={column.key}
                    value={filters[column.key] || ''}
                    onChange={(e) => setFilters({ ...filters, [column.key]: e.target.value })}
                    className='h-10 rounded-xl border border-[#E5E0D8] px-4 text-sm focus:outline-none focus:border-[#7A0019] bg-white'
                  >
                    <option value=''>{column.label}</option>
                    {getUniqueValues(column.key).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className='overflow-x-auto rounded-2xl border border-[rgba(214,169,74,0.24)] shadow-[0_8px_24px_rgba(74,0,17,0.06)]'>
        <table className='w-full border-collapse bg-white'>
          <thead>
            <tr className='bg-[#7A0019] text-white'>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-4 text-left text-sm font-semibold ${
                    column.sortable ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className='flex items-center gap-2'>
                    {column.label}
                    {column.sortable && (
                      <span className='flex items-center'>
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUpIcon className='h-4 w-4' />
                          ) : (
                            <ChevronDownIcon className='h-4 w-4' />
                          )
                        ) : (
                          <FunnelIcon className='h-4 w-4 opacity-50' />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className='border-b border-[rgba(229,224,216,0.8)] hover:bg-[rgba(122,0,25,0.04)] transition-colors'
              >
                {columns.map((column) => (
                  <td key={column.key} className='px-5 py-4 text-sm text-[#1E293B]'>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedData.length === 0 && (
          <div className='py-12 text-center'>
            <p className='text-[#64748B]'>No se encontraron resultados</p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      <div className='flex items-center justify-between text-sm text-[#64748B]'>
        <p>Mostrando {sortedData.length} de {data.length} registros</p>
      </div>
    </div>
  );
};
