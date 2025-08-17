import { SimpleGrid, Box, Stat, StatLabel, StatNumber, StatArrow } from '@chakra-ui/react';

interface SummaryData {
  revenue: number;
  expense: number;
  net: number;
}

interface SummaryCardsProps {
  data: SummaryData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <SimpleGrid columns={[1, null, 3]} spacing={4}>
      <Stat>
        <Box p={4} borderWidth={1} borderRadius="lg" bg="green.50">
          <StatLabel>Revenue</StatLabel>
          <StatNumber>£{data.revenue.toFixed(2)}</StatNumber>
        </Box>
      </Stat>

      <Stat>
        <Box p={4} borderWidth={1} borderRadius="lg" bg="red.50">
          <StatLabel>Expense</StatLabel>
          <StatNumber>£{data.expense.toFixed(2)}</StatNumber>
        </Box>
      </Stat>

      <Stat>
        <Box p={4} borderWidth={1} borderRadius="lg" bg={data.net >= 0 ? 'blue.50' : 'orange.50'}>
          <StatLabel>Net Balance</StatLabel>
          <StatNumber>
            <StatArrow type={data.net >= 0 ? 'increase' : 'decrease'} />
            £{data.net.toFixed(2)}
          </StatNumber>
        </Box>
      </Stat>
    </SimpleGrid>
  );
}
