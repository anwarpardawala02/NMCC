import { Box, Table, Thead, Tbody, Tr, Th, Td, Select, HStack } from '@chakra-ui/react';

interface Transaction {
  id: string;
  player: { full_name: string } | null;
  category: { name: string };
  kind: 'revenue' | 'expense';
  amount: number;
  occurred_on: string;
  notes?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  onFilterChange?: (filters: { month?: string; kind?: string }) => void;
  filters?: {
    month?: string;
    kind?: string;
  };
}

export function TransactionsTable({ 
  transactions, 
  onFilterChange,
  filters = {}
}: TransactionsTableProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  return (
    <Box>
      {onFilterChange && (
        <HStack spacing={4} mb={4}>
          <Select
            value={filters.month || currentMonth}
            onChange={e => onFilterChange({ ...filters, month: e.target.value })}
          >
            <option value="">All months</option>
            {/* Generate last 12 months */}
            {Array.from({ length: 12 }).map((_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = date.toISOString().slice(0, 7);
              return (
                <option key={value} value={value}>
                  {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </Select>

          <Select
            value={filters.kind || ''}
            onChange={e => onFilterChange({ ...filters, kind: e.target.value })}
          >
            <option value="">All types</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
          </Select>
        </HStack>
      )}

      <Table>
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Player</Th>
            <Th>Category</Th>
            <Th>Type</Th>
            <Th isNumeric>Amount</Th>
            <Th>Notes</Th>
          </Tr>
        </Thead>
        <Tbody>
          {transactions.map(tx => (
            <Tr key={tx.id}>
              <Td>{new Date(tx.occurred_on).toLocaleDateString()}</Td>
              <Td>{tx.player?.full_name || 'Club'}</Td>
              <Td>{tx.category.name}</Td>
              <Td>{tx.kind}</Td>
              <Td isNumeric>£{tx.amount.toFixed(2)}</Td>
              <Td>{tx.notes}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
