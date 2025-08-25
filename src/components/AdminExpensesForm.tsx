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
  Textarea
} from '@chakra-ui/react';
import { createExpense, listExpenses } from '../lib/db';
import type { Expense } from '../lib/db';

export function AdminExpensesForm() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    expense_type: 'equipment' as 'equipment' | 'ground' | 'travel' | 'refreshments' | 'other',
    amount: 0,
    expense_date: '',
    description: '',
    paid_by: '',
    reimbursed: false
  });
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
        status: 'success'
      });
      setForm({
        expense_type: 'equipment',
        amount: 0,
        expense_date: '',
        description: '',
        paid_by: '',
        reimbursed: false
      });
      loadExpenses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error'
      });
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
                <FormLabel>Expense Type</FormLabel>
                <Select
                  value={form.expense_type}
                  onChange={e => setForm(prev => ({ ...prev, expense_type: e.target.value as any }))}
                >
                  <option value="equipment">Equipment</option>
                  <option value="ground">Ground Maintenance</option>
                  <option value="travel">Travel</option>
                  <option value="refreshments">Refreshments</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Amount (£)</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.amount}
                    onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </NumberInput>
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Expense Date</FormLabel>
                <Input
                  type="date"
                  value={form.expense_date}
                  onChange={e => setForm(prev => ({ ...prev, expense_date: e.target.value }))}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Paid By</FormLabel>
                <Input
                  value={form.paid_by}
                  onChange={e => setForm(prev => ({ ...prev, paid_by: e.target.value }))}
                  placeholder="Name of person who paid"
                />
              </FormControl>
            </HStack>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the expense"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Reimbursed</FormLabel>
              <Select
                value={form.reimbursed ? "true" : "false"}
                onChange={e => setForm(prev => ({ ...prev, reimbursed: e.target.value === "true" }))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Recording..."
              w="full"
            >
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
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Paid By</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expenses.map(expense => (
                <Tr key={expense.id}>
                  <Td>
                    <Badge colorScheme="blue" textTransform="capitalize">
                      {expense.expense_type}
                    </Badge>
                  </Td>
                  <Td>£{expense.amount.toFixed(2)}</Td>
                  <Td>{new Date(expense.expense_date).toLocaleDateString()}</Td>
                  <Td>{expense.paid_by}</Td>
                  <Td>{expense.description}</Td>
                  <Td>
                    <Badge colorScheme={expense.reimbursed ? "green" : "red"}>
                      {expense.reimbursed ? "REIMBURSED" : "PENDING"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}
