import React from 'react';

export const Table = ({ 
  columns, 
  data, 
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse bg-white rounded-2xl shadow-[0_8px_24px_rgba(74,0,17,0.06)]">
        <thead>
          <tr className="bg-[#0A2472] text-white">
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
              className="border-b border-[rgba(229,224,216,0.8)] hover:bg-[rgba(10,36,114,0.04)] transition-colors duration-200"
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
