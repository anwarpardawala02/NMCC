import { useEffect, useState } from "react";
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Badge, VStack } from "@chakra-ui/react";
import { supabase } from "../../lib/supabaseClient";

interface Match {
  id: number;
  date: string;
  opponent: string;
  location: string;
  format: string;
  result: string;
}

export default function TeamMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        setMatches(data || []);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  // Function to format date nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get result badge color based on match outcome
  const getResultBadge = (result: string) => {
    const lowerResult = result.toLowerCase();
    if (lowerResult.includes('win')) return 'green';
    if (lowerResult.includes('loss') || lowerResult.includes('lost')) return 'red';
    if (lowerResult.includes('draw') || lowerResult.includes('tie')) return 'yellow';
    return 'gray';
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center">
        <Heading size="xl" mb={2} color="green.600">Match Schedule</Heading>
        <Text color="gray.600">Recent and upcoming matches for Northolt Manor Cricket Club</Text>
      </Box>

      {loading ? (
        <Text textAlign="center">Loading matches...</Text>
      ) : matches.length === 0 ? (
        <Text textAlign="center">No matches scheduled yet.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead bg="blue.500">
              <Tr>
                <Th color="white">Date</Th>
                <Th color="white">Opponent</Th>
                <Th color="white">Format</Th>
                <Th color="white">Location</Th>
                <Th color="white">Result</Th>
              </Tr>
            </Thead>
            <Tbody>
              {matches.map((match) => (
                <Tr key={match.id}>
                  <Td fontWeight="medium">{formatDate(match.date)}</Td>
                  <Td>{match.opponent}</Td>
                  <Td>{match.format}</Td>
                  <Td>{match.location}</Td>
                  <Td>
                    {match.result ? (
                      <Badge colorScheme={getResultBadge(match.result)}>
                        {match.result}
                      </Badge>
                    ) : (
                      <Badge>Upcoming</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </VStack>
  );
}
