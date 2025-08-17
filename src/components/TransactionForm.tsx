import { useState, useEffect } from 'react';
import { 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  NumberInput,
  NumberInputField,
  Select,
  Textarea,
  VStack,
  useToast 
} from '@chakra-ui/react';
import { PlayerSelect } from './PlayerSelect';
import { listCategories, addTransaction } from '../lib/db';

interface TransactionFormProps {
  onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; kind: 'revenue' | 'expense' }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    player_id: '',
    category_id: '',
    kind: '' as 'revenue' | 'expense' | '',
    amount: '',
    occurred_on: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addTransaction({
        ...form,
        amount: Number(form.amount),
        kind: form.kind as 'revenue' | 'expense'
      });
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
        status: 'success'
      });
      setForm({
        player_id: '',
        category_id: '',
        kind: '',
        amount: '',
        occurred_on: new Date().toISOString().split('T')[0],
        notes: ''
      });
      onSuccess();
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

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setForm(prev => ({
      ...prev,
      category_id: categoryId,
      kind: category?.kind || ''
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Player (Optional)</FormLabel>
          <PlayerSelect
            value={form.player_id}
            onChange={(id: string) => setForm(prev => ({ ...prev, player_id: id }))}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            value={form.category_id}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCategoryChange(e.target.value)}
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.kind})
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Amount (£)</FormLabel>
          <NumberInput min={0}>
            <NumberInputField
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
            />
          </NumberInput>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Date</FormLabel>
          <Input
            type="date"
            value={form.occurred_on}
            onChange={e => setForm(prev => ({ ...prev, occurred_on: e.target.value }))}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={loading}
          loadingText="Adding..."
          w="full"
        >
          Add Transaction
        </Button>
      </VStack>
    </form>
  );
}
