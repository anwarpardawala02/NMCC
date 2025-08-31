import { useState, useEffect } from 'react';
import { 
  VStack, 
  HStack,
  FormControl, 
  FormLabel, 
  NumberInput,
  NumberInputField,
  Button,
  useToast,
  Box,
  Heading,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { PlayerSelect } from './PlayerSelect';
import { updatePlayerStatistics, listPlayerStatistics } from '../lib/db';
import type { PlayerStatistics } from '../lib/db';

export function AdminStatsForm() {
  const [statistics, setStatistics] = useState<PlayerStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString());
  const [form, setForm] = useState({
    player_id: '',
    matches_played: 0,
    runs_scored: 0,
    balls_faced: 0,
    fours: 0,
    sixes: 0,
    wickets_taken: 0,
    overs_bowled: 0,
    runs_conceded: 0,
    catches: 0,
    stumpings: 0
  });
  const toast = useToast();

  useEffect(() => {
    loadStatistics();
  }, [selectedSeason]);

  async function loadStatistics() {
    try {
      const data = await listPlayerStatistics(selectedSeason);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.player_id) {
      toast({
        title: 'Error',
        description: 'Please select a player',
        status: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      await updatePlayerStatistics(form.player_id, form);
      toast({
        title: 'Statistics Updated',
        description: 'Player statistics have been updated successfully',
        status: 'success'
      });
      setForm({
        player_id: '',
        matches_played: 0,
        runs_scored: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        wickets_taken: 0,
        overs_bowled: 0,
        runs_conceded: 0,
        catches: 0,
        stumpings: 0
      });
      loadStatistics();
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

  // Generate season options
  const seasonOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Update Player Statistics</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Player</FormLabel>
                <PlayerSelect
                  value={form.player_id}
                  onChange={(id: string) => setForm(prev => ({ ...prev, player_id: id }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Season</FormLabel>
                <Select
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(e.target.value)}
                >
                  {seasonOptions.map(season => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            <Heading size="sm" alignSelf="start">Batting Statistics</Heading>
            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Matches Played</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.matches_played}
                    onChange={e => setForm(prev => ({ ...prev, matches_played: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Runs Scored</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.runs_scored}
                    onChange={e => setForm(prev => ({ ...prev, runs_scored: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Balls Faced</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.balls_faced}
                    onChange={e => setForm(prev => ({ ...prev, balls_faced: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Fours</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.fours}
                    onChange={e => setForm(prev => ({ ...prev, fours: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Sixes</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.sixes}
                    onChange={e => setForm(prev => ({ ...prev, sixes: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Catches</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.catches}
                    onChange={e => setForm(prev => ({ ...prev, catches: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>
            </HStack>

            <Heading size="sm" alignSelf="start">Bowling Statistics</Heading>
            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Wickets Taken</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.wickets_taken}
                    onChange={e => setForm(prev => ({ ...prev, wickets_taken: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Overs Bowled</FormLabel>
                <NumberInput min={0} step={0.1}>
                  <NumberInputField
                    value={form.overs_bowled}
                    onChange={e => setForm(prev => ({ ...prev, overs_bowled: parseFloat(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Runs Conceded</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={form.runs_conceded}
                    onChange={e => setForm(prev => ({ ...prev, runs_conceded: parseInt(e.target.value) || 0 }))}
                  />
                </NumberInput>
              </FormControl>
            </HStack>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Updating..."
              w="full"
            >
              Update Statistics
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>Current Season Statistics</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Player</Th>
                <Th isNumeric>Matches</Th>
                <Th isNumeric>Runs</Th>
                <Th isNumeric>Average</Th>
                <Th isNumeric>Wickets</Th>
                <Th isNumeric>Catches</Th>
              </Tr>
            </Thead>
            <Tbody>
              {statistics.map(stat => (
                <Tr key={stat.id}>
                  <Td>{stat.player?.full_name}</Td>
                  <Td isNumeric>{stat.games}</Td>
                  <Td isNumeric>{stat.runs}</Td>
                  <Td isNumeric>
                    {stat.inns - stat.not_outs > 0 ? (stat.runs / (stat.inns - stat.not_outs)).toFixed(2) : '0.00'}
                  </Td>
                  <Td isNumeric>{stat.wickets}</Td>
                  <Td isNumeric>{stat.total_catches}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}