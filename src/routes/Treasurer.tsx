import { useState, useEffect } from 'react';
import { Box, Heading, VStack, SimpleGrid } from '@chakra-ui/react';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionsTable } from '../components/TransactionsTable';
import { SummaryCards } from '../components/SummaryCards';
import { listTransactions } from '../lib/db';

export function Treasurer() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ month: string; kind: string }>({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    kind: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  async function loadTransactions() {
    try {
      const data = await listTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }

  const handleTransactionAdded = () => {
    loadTransactions();
  };

  const summaryData = transactions.reduce((acc: any, tx: any) => {
    const amount = Number(tx.amount);
    if (tx.kind === 'revenue') {
      acc.revenue += amount;
    } else {
      acc.expense += amount;
    }
    acc.net = acc.revenue - acc.expense;
    return acc;
  }, { revenue: 0, expense: 0, net: 0 });

  return (
    <Box>
      <Heading mb={8}>Treasurer Dashboard</Heading>

      <SimpleGrid columns={[1, null, 2]} spacing={8} mb={8}>
        <VStack spacing={4} align="stretch">
          <Box p={4} borderWidth={1} borderRadius="lg">
            <Heading size="md" mb={4}>Add Transaction</Heading>
            <TransactionForm onSuccess={handleTransactionAdded} />
          </Box>
        </VStack>

        <Box>
          <SummaryCards data={summaryData} />
        </Box>
      </SimpleGrid>

      <Box>
        <Heading size="md" mb={4}>Recent Transactions</Heading>
        <TransactionsTable 
          transactions={transactions}
          onFilterChange={(f: { month?: string; kind?: string }) => setFilters(prev => ({ ...prev, ...f }))}
          filters={filters}
        />
      </Box>
    </Box>
  );
}
