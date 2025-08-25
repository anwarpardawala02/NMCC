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
  Textarea
} from '@chakra-ui/react';
import { createFixture, listFixtures } from '../lib/db';
import type { Fixture } from '../lib/db';

export function AdminFixtureForm() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    opponent: '',
    fixture_date: '',
    ground: '',
    home_away: 'home' as 'home' | 'away',
    notes: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadFixtures();
  }, []);

  async function loadFixtures() {
    try {
      const data = await listFixtures();
      setFixtures(data);
    } catch (error) {
      console.error('Failed to load fixtures:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createFixture(form);
      toast({
        title: 'Fixture Created',
        description: 'Fixture has been successfully added to the schedule',
        status: 'success'
      });
      setForm({
        opponent: '',
        fixture_date: '',
        ground: '',
        home_away: 'home',
        notes: ''
      });
      loadFixtures();
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
        <Heading size="md" mb={4}>Add New Fixture</Heading>
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
                  value={form.fixture_date}
                  onChange={e => setForm(prev => ({ ...prev, fixture_date: e.target.value }))}
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Ground</FormLabel>
                <Input
                  value={form.ground}
                  onChange={e => setForm(prev => ({ ...prev, ground: e.target.value }))}
                  placeholder="Match venue/ground"
                />
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

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional information about this fixture"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Creating..."
              w="full"
            >
              Create Fixture
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>All Fixtures</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Opponent</Th>
                <Th>Ground</Th>
                <Th>Home/Away</Th>
                <Th>Notes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fixtures.map(fixture => (
                <Tr key={fixture.id}>
                  <Td>{new Date(fixture.fixture_date).toLocaleDateString()}</Td>
                  <Td>{fixture.opponent}</Td>
                  <Td>{fixture.ground}</Td>
                  <Td>
                    <Badge colorScheme={fixture.home_away === 'home' ? "green" : "blue"}>
                      {fixture.home_away.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>{fixture.notes}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}
