import { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast,
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  NumberInput,
  NumberInputField,
  Textarea,
} from '@chakra-ui/react';
import { createExpense, listExpenses } from '../lib/db';
import type { Expense } from '../lib/db';

export function AdminExpensesForm() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ category: Expense['category']; amount: number; date: string; description: string }>(
    { category: 'Ground', amount: 0, date: '', description: '' }
  );
  const toast = useToast();

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const data = await listExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createExpense(form);
      toast({
        title: 'Expense Recorded',
        description: 'Expense has been successfully recorded',
        status: 'success',
      });
      setForm({ category: 'Ground', amount: 0, date: '', description: '' });
      await loadExpenses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Record New Expense</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as Expense['category'] }))}
                >
                  <option value="Ground">Ground</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Chai">Chai</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Amount (£)</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </NumberInput>
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the expense"
                />
              </FormControl>
            </HStack>

            <Button type="submit" colorScheme="green" isLoading={loading} loadingText="Recording..." w="full">
              Record Expense
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>All Expenses</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Category</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Description</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expenses.map((expense) => (
                <Tr key={expense.id}>
                  <Td>
                    <Badge colorScheme="blue">{expense.category}</Badge>
                  </Td>
                  <Td>£{expense.amount.toFixed(2)}</Td>
                  <Td>{new Date(expense.date).toLocaleDateString()}</Td>
                  <Td>{expense.description}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}
