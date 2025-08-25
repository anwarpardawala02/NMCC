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
import { createFee, listFees, listPlayers } from '../lib/db';
import type { Fee, Player } from '../lib/db';

export function AdminFeesForm() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    player_id: '',
    fee_type: 'membership' as 'membership' | 'match' | 'training' | 'other',
    amount: 0,
    due_date: '',
    paid: false,
    notes: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadFees();
    loadPlayers();
  }, []);

  async function loadFees() {
    try {
      const data = await listFees();
      setFees(data);
    } catch (error) {
      console.error('Failed to load fees:', error);
    }
  }

  async function loadPlayers() {
    try {
      const data = await listPlayers(true);
      setPlayers(data);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createFee(form);
      toast({
        title: 'Fee Created',
        description: 'Fee has been successfully recorded',
        status: 'success'
      });
      setForm({
        player_id: '',
        fee_type: 'membership',
        amount: 0,
        due_date: '',
        paid: false,
        notes: ''
      });
      loadFees();
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

  // Find player name by ID
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.full_name : 'Unknown Player';
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Add New Fee</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Player</FormLabel>
                <Select
                  placeholder="Select player"
                  value={form.player_id}
                  onChange={e => setForm(prev => ({ ...prev, player_id: e.target.value }))}
                >
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.full_name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fee Type</FormLabel>
                <Select
                  value={form.fee_type}
                  onChange={e => setForm(prev => ({ ...prev, fee_type: e.target.value as any }))}
                >
                  <option value="membership">Membership</option>
                  <option value="match">Match Fee</option>
                  <option value="training">Training Fee</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Amount (£)</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.amount}
                    onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Paid</FormLabel>
              <Select
                value={form.paid ? "true" : "false"}
                onChange={e => setForm(prev => ({ ...prev, paid: e.target.value === "true" }))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional information about this fee"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Creating..."
              w="full"
            >
              Record Fee
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>All Fees</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Player</Th>
                <Th>Fee Type</Th>
                <Th>Amount</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th>Notes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fees.map(fee => (
                <Tr key={fee.id}>
                  <Td>{getPlayerName(fee.player_id)}</Td>
                  <Td>
                    <Badge colorScheme="purple" textTransform="capitalize">
                      {fee.fee_type}
                    </Badge>
                  </Td>
                  <Td>£{fee.amount.toFixed(2)}</Td>
                  <Td>{new Date(fee.due_date).toLocaleDateString()}</Td>
                  <Td>
                    <Badge colorScheme={fee.paid ? "green" : "red"}>
                      {fee.paid ? "PAID" : "UNPAID"}
                    </Badge>
                  </Td>
                  <Td>{fee.notes}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}
