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
  Badge
} from '@chakra-ui/react';
import { createMatch, listMatches } from '../lib/db';
import type { Match } from '../lib/db';

export function AdminMatchForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    opponent: '',
    match_date: '',
    match_time: '',
    venue: '',
    match_type: 'league' as 'league' | 'friendly' | 'cup' | 'tournament',
    home_away: 'home' as 'home' | 'away'
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
  await createMatch({ ...form, status: 'scheduled' });
      toast({
        title: 'Match Created',
        description: 'Match has been added to the fixture list',
        status: 'success'
      });
      setForm({
        opponent: '',
        match_date: '',
        match_time: '',
        venue: '',
        match_type: 'league',
        home_away: 'home'
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
                <FormLabel>Opponent</FormLabel>
                <Input
                  value={form.opponent}
                  onChange={e => setForm(prev => ({ ...prev, opponent: e.target.value }))}
                  placeholder="Opposition team name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={form.match_date}
                  onChange={e => setForm(prev => ({ ...prev, match_date: e.target.value }))}
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  value={form.match_time}
                  onChange={e => setForm(prev => ({ ...prev, match_time: e.target.value }))}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Venue</FormLabel>
                <Input
                  value={form.venue}
                  onChange={e => setForm(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Match venue"
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Match Type</FormLabel>
                <Select
                  value={form.match_type}
                  onChange={e => setForm(prev => ({ ...prev, match_type: e.target.value as any }))}
                >
                  <option value="league">League</option>
                  <option value="friendly">Friendly</option>
                  <option value="cup">Cup</option>
                  <option value="tournament">Tournament</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Home/Away</FormLabel>
                <Select
                  value={form.home_away}
                  onChange={e => setForm(prev => ({ ...prev, home_away: e.target.value as any }))}
                >
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </Select>
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
                <Th>Opponent</Th>
                <Th>Venue</Th>
                <Th>Type</Th>
                <Th>Home/Away</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {matches.map(match => (
                <Tr key={match.id}>
                  <Td>{new Date(match.match_date).toLocaleDateString()}</Td>
                  <Td>{match.opponent}</Td>
                  <Td>{match.venue}</Td>
                  <Td>
                    <Badge colorScheme="purple" textTransform="capitalize">
                      {match.match_type}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={match.home_away === 'home' ? 'green' : 'blue'}>
                      {match.home_away.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={match.status === 'scheduled' ? 'yellow' : 'gray'}>
                      {match.status.toUpperCase()}
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