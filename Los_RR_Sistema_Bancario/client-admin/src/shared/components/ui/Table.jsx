import React from 'react';

export const Table = ({ 
  columns, 
  data, 
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse bg-white rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <thead>
          <tr className="bg-[#0F172A] text-white">
            {columns.map((column) => (
              <th 
                key={column.key} 
                className="px-5 py-4 text-left text-sm font-semibold"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className="border-b border-[rgba(226,232,240,0.6)] hover:bg-[rgba(37,99,235,0.04)] transition-colors duration-200"
            >
              {columns.map((column) => (
                <td 
                  key={column.key} 
                  className="px-5 py-4 text-sm text-[#1E293B]"
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
