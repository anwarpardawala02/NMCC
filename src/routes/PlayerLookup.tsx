import { useState } from 'react';
import { Box, Input, Button, VStack, Heading } from '@chakra-ui/react';
import { TransactionsTable } from '../components/TransactionsTable';
// import { getPlayerWithTransactions } from '../lib/db';

export function PlayerLookup() {
  const [search, setSearch] = useState('');
  const [player, setPlayer] = useState<any>(null);

  const handleSearch = async () => {
    if (!search) return;
  // TODO: Implement player lookup logic or re-add getPlayerWithTransactions
  setPlayer(null);
  };

  if (!player) {
    return (
      <Box maxW="md" mx="auto">
        <VStack spacing={4}>
          <Input
            placeholder="Search by player ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button onClick={handleSearch} colorScheme="blue">
            Search
          </Button>
        </VStack>
      </Box>
    );
  }

  const transactions = player.transactions || [];
  const totals = transactions.reduce((acc: any, tx: any) => {
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
      <Heading size="lg" mb={4}>{player.full_name}</Heading>
      <Box mb={8}>
        <p>Email: {player.email}</p>
        <p>Phone: {player.phone}</p>
        <p>Joined: {new Date(player.join_date).toLocaleDateString()}</p>
      </Box>

      <Box mb={8}>
        <Heading size="md" mb={4}>Transaction History</Heading>
        <Box mb={4}>
          <p>Total Revenue: £{totals.revenue.toFixed(2)}</p>
          <p>Total Expense: £{totals.expense.toFixed(2)}</p>
          <p>Net Balance: £{totals.net.toFixed(2)}</p>
        </Box>
        <TransactionsTable transactions={transactions} />
      </Box>
    </Box>
  );
}
