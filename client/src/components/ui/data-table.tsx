import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    title: string;
    render?: (item: T) => React.ReactNode;
  }[];
  emptyMessage?: string;
  isLoading?: boolean;
  searchFunction?: (item: T, searchQuery: string) => boolean;
}

export function DataTable<T>({
  data,
  columns,
  emptyMessage = "No data found",
  isLoading = false,
  searchFunction,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<T[]>(data);

  useEffect(() => {
    if (!searchQuery || !searchFunction) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => searchFunction(item, searchQuery));
    setFilteredData(filtered);
  }, [data, searchQuery, searchFunction]);

  const renderTableCell = (item: T, column: { key: keyof T | string; render?: (item: T) => React.ReactNode }) => {
    if (column.render) {
      return column.render(item);
    }

    const key = column.key as keyof T;
    const value = item[key];
    return String(value != null ? value : "-");
  };

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {searchFunction && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key.toString()}>{column.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  {columns.map((column) => (
                    <TableCell key={column.key.toString()}>
                      {renderTableCell(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
