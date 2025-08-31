import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Container,
  Select,
  HStack,
  Text,
  VStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Badge
} from "@chakra-ui/react";
import { listPlayerStatistics } from "../lib/db";
import type { PlayerStatistics } from "../lib/db";

export default function Statistics() {
  const [statistics, setStatistics] = useState<PlayerStatistics[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear().toString());

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

  // Calculate team totals
  const teamStats = statistics.reduce((acc, stat) => {
  acc.totalMatches += stat.games;
  acc.totalRuns += stat.runs;
  acc.totalWickets += stat.wickets;
  acc.totalCatches += stat.total_catches;
    return acc;
  }, { totalMatches: 0, totalRuns: 0, totalWickets: 0, totalCatches: 0 });

  // Generate season options (current year and 4 years back)
  const seasonOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  const calculateAverage = (runs: number, matches: number) => {
    return matches > 0 ? (runs / matches).toFixed(2) : '0.00';
  };

  const calculateStrikeRate = (runs: number, balls: number) => {
    return balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Player Statistics
          </Heading>
          <HStack justify="center" spacing={4}>
            <Text>Season:</Text>
            <Select 
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(e.target.value)}
              w="150px"
            >
              {seasonOptions.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </Select>
          </HStack>
        </Box>

        {/* Team Summary */}
        <Box p={6} bg="green.50" borderRadius="lg">
          <Heading size="md" mb={4} color="green.800">Team Summary - {selectedSeason}</Heading>
          <SimpleGrid columns={[2, 4]} spacing={4}>
            <Stat>
              <StatLabel>Total Matches</StatLabel>
              <StatNumber>{teamStats.totalMatches}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Runs</StatLabel>
              <StatNumber>{teamStats.totalRuns}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Wickets</StatLabel>
              <StatNumber>{teamStats.totalWickets}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Catches</StatLabel>
              <StatNumber>{teamStats.totalCatches}</StatNumber>
            </Stat>
          </SimpleGrid>
        </Box>

        {statistics.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Heading size="md" color="gray.500" mb={2}>
              No statistics available
            </Heading>
            <Text color="gray.400">
              Statistics for the {selectedSeason} season will appear here once recorded
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" bg="white" borderRadius="lg">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Player</Th>
                  <Th isNumeric>Matches</Th>
                  <Th isNumeric>Runs</Th>
                  <Th isNumeric>Average</Th>
                  <Th isNumeric>Strike Rate</Th>
                  <Th isNumeric>4s</Th>
                  <Th isNumeric>6s</Th>
                  <Th isNumeric>Wickets</Th>
                  <Th isNumeric>Overs</Th>
                  <Th isNumeric>Catches</Th>
                </Tr>
              </Thead>
              <Tbody>
                {statistics
                  .sort((a, b) => b.runs - a.runs) // Sort by runs scored
                  .map((stat) => (
                    <Tr key={stat.id}>
                      <Td fontWeight="medium">
                        {stat.player?.full_name}
                        {stat.games === 0 && (
                          <Badge ml={2} colorScheme="gray" size="sm">No matches</Badge>
                        )}
                      </Td>
                      <Td isNumeric>{stat.games}</Td>
                      <Td isNumeric>{stat.runs}</Td>
                      <Td isNumeric>{calculateAverage(stat.runs, stat.inns - stat.not_outs)}</Td>
                      <Td isNumeric>{calculateStrikeRate(stat.runs, 0)}</Td>
                      <Td isNumeric>{stat.fifties}</Td>
                      <Td isNumeric>{stat.hundreds}</Td>
                      <Td isNumeric>{stat.wickets}</Td>
                      <Td isNumeric>{stat.overs}</Td>
                      <Td isNumeric>{stat.total_catches}</Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box p={4} bg="blue.50" borderRadius="lg">
          <Text fontSize="sm" color="blue.800">
            <strong>Note:</strong> Statistics are updated by club administrators after each match. 
            If you notice any discrepancies, please contact a club official.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}