import { useState, useEffect } from 'react';
import { 
  VStack, 
  HStack,
  FormControl, 
  FormLabel, 
  Input, 
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
  Badge
} from '@chakra-ui/react';
import { createMatch, listMatches } from '../lib/db';
import type { Match } from '../lib/db';

export function AdminMatchForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    opposition: '',
    date: '',
    venue: '',
    result: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const data = await listMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
  await createMatch(form);
      toast({
        title: 'Match Created',
        description: 'Match has been added to the fixture list',
        status: 'success'
      });
      setForm({
        opposition: '',
        date: '',
        venue: '',
        result: ''
      });
      loadMatches();
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
        <Heading size="md" mb={4}>Add New Match</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Opposition</FormLabel>
                <Input
                  value={form.opposition}
                  onChange={e => setForm(prev => ({ ...prev, opposition: e.target.value }))}
                  placeholder="Opposition team name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Venue</FormLabel>
                <Input
                  value={form.venue}
                  onChange={e => setForm(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Match venue"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Result</FormLabel>
                <Input
                  value={form.result}
                  onChange={e => setForm(prev => ({ ...prev, result: e.target.value }))}
                  placeholder="Match result (if known)"
                />
              </FormControl>
            </HStack>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Creating..."
              w="full"
            >
              Create Match
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>All Matches</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Opposition</Th>
                <Th>Venue</Th>
                <Th>Result</Th>
                <Th>Player</Th>
              </Tr>
            </Thead>
            <Tbody>
              {matches.map(match => (
                <Tr key={match.id}>
                  <Td>{new Date(match.date).toLocaleDateString()}</Td>
                  <Td>{match.opposition}</Td>
                  <Td>{match.venue}</Td>
                  <Td>
                    {match.result || "N/A"}
                  </Td>
                  <Td>
                    {match.player_name ? (
                      <Badge colorScheme="green">
                        {match.player_name}
                      </Badge>
                    ) : "Team Match"}
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