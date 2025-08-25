import { useEffect, useState } from "react";
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, 
         VStack, Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react";
import { supabase } from "../../lib/supabaseClient";


interface BattingStats {
  player_id: string;
  player_name: string;
  games: number;
  inns: number;
  not_outs: number;
  runs: number;
  high_score: number;
  high_score_not_out: boolean;
  avg: number;
  fifties: number;
  hundreds: number;
  strike_rate: number;
}

interface BowlingStats {
  player_id: string;
  player_name: string;
  games: number;
  overs: number;
  maidens: number;
  bowling_runs: number;
  wickets: number;
  best_bowling: string;
  five_wicket_haul: number;
  economy_rate: number;
  bowling_strike_rate: number;
  bowling_average: number;
}

interface FieldingStats {
  player_id: string;
  player_name: string;
  games: number;
  wk_catches: number;
  stumpings: number;
  total_wk_wickets: number;
  fielding_catches: number;
  run_outs: number;
  total_fielding_wickets: number;
  total_catches: number;
  total_victims: number;
}


export default function TeamStatistics() {
  const [battingStats, setBattingStats] = useState<BattingStats[]>([]);
  const [bowlingStats, setBowlingStats] = useState<BowlingStats[]>([]);
  const [fieldingStats, setFieldingStats] = useState<FieldingStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        // Batting
        const { data: battingData, error: battingError } = await supabase
          .from('player_statistics')
          .select('player_id, player_name, games, inns, not_outs, runs, high_score, high_score_not_out, avg, fifties, hundreds, strike_rate')
          .order('runs', { ascending: false });
        if (battingError) throw battingError;

        // Bowling
        const { data: bowlingData, error: bowlingError } = await supabase
          .from('player_statistics')
          .select('player_id, player_name, games, overs, maidens, bowling_runs, wickets, best_bowling, five_wicket_haul, economy_rate, bowling_strike_rate, bowling_average')
          .order('wickets', { ascending: false });
        if (bowlingError) throw bowlingError;

        // Fielding
        const { data: fieldingData, error: fieldingError } = await supabase
          .from('player_statistics')
          .select('player_id, player_name, games, wk_catches, stumpings, total_wk_wickets, fielding_catches, run_outs, total_fielding_wickets, total_catches, total_victims')
          .order('total_victims', { ascending: false });
        if (fieldingError) throw fieldingError;

        // Sort again in JS to guarantee correct order if needed
        setBattingStats((battingData || []).sort((a, b) => b.runs - a.runs));
        setBowlingStats((bowlingData || []).sort((a, b) => b.wickets - a.wickets));
        setFieldingStats((fieldingData || []).sort((a, b) => b.total_victims - a.total_victims));
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatistics();
  }, []);

  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center">
        <Heading size="xl" mb={2} color="green.600">Team Statistics</Heading>
        <Text color="gray.600">Performance statistics for Northolt Manor Cricket Club</Text>
      </Box>

      {loading ? (
        <Text textAlign="center">Loading statistics...</Text>
      ) : (
        <Tabs colorScheme="blue" isFitted variant="enclosed-colored">
          <TabList>
            <Tab>Batting</Tab>
            <Tab>Bowling</Tab>
            <Tab>Fielding</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Box overflowX="auto" minW="1200px">
                <Table variant="simple" minWidth="1200px">
                  <Thead bg="blue.500">
                    <Tr>
                      <Th color="white">Player</Th>
                      <Th color="white" isNumeric>Matches</Th>
                      <Th color="white" isNumeric>Inns</Th>
                      <Th color="white" isNumeric>Not Outs</Th>
                      <Th color="white" isNumeric>Runs</Th>
                      <Th color="white" isNumeric>High Score</Th>
                      <Th color="white">HS*</Th>
                      <Th color="white" isNumeric>Avg</Th>
                      <Th color="white" isNumeric>50s</Th>
                      <Th color="white" isNumeric>100s</Th>
                      <Th color="white" isNumeric>SR</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {battingStats.length > 0 ? battingStats.map((stats) => (
                      <Tr key={stats.player_id}>
                        <Td fontWeight="medium">{stats.player_name}</Td>
                        <Td isNumeric>{stats.games}</Td>
                        <Td isNumeric>{stats.inns}</Td>
                        <Td isNumeric>{stats.not_outs}</Td>
                        <Td isNumeric>{stats.runs}</Td>
                        <Td isNumeric>{stats.high_score}</Td>
                        <Td>{stats.high_score_not_out ? 'Yes' : 'No'}</Td>
                        <Td isNumeric>{stats.avg?.toFixed(2)}</Td>
                        <Td isNumeric>{stats.fifties}</Td>
                        <Td isNumeric>{stats.hundreds}</Td>
                        <Td isNumeric>{stats.strike_rate?.toFixed(2)}</Td>
                      </Tr>
                    )) : (
                      <Tr>
                        <Td colSpan={11} textAlign="center">No batting statistics available yet.</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
            <TabPanel>
              <Box overflowX="auto" minW="1200px">
                <Table variant="simple" minWidth="1200px">
                  <Thead bg="blue.500">
                    <Tr>
                      <Th color="white">Player</Th>
                      <Th color="white" isNumeric>Matches</Th>
                      <Th color="white" isNumeric>Overs</Th>
                      <Th color="white" isNumeric>Maidens</Th>
                      <Th color="white" isNumeric>Runs</Th>
                      <Th color="white" isNumeric>Wickets</Th>
                      <Th color="white">Best</Th>
                      <Th color="white" isNumeric>5WI</Th>
                      <Th color="white" isNumeric>Eco</Th>
                      <Th color="white" isNumeric>SR</Th>
                      <Th color="white" isNumeric>Avg</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {bowlingStats.length > 0 ? bowlingStats.map((stats) => (
                      <Tr key={stats.player_id}>
                        <Td fontWeight="medium">{stats.player_name}</Td>
                        <Td isNumeric>{stats.games}</Td>
                        <Td isNumeric>{stats.overs}</Td>
                        <Td isNumeric>{stats.maidens}</Td>
                        <Td isNumeric>{stats.bowling_runs}</Td>
                        <Td isNumeric>{stats.wickets}</Td>
                        <Td>{stats.best_bowling}</Td>
                        <Td isNumeric>{stats.five_wicket_haul}</Td>
                        <Td isNumeric>{stats.economy_rate?.toFixed(2)}</Td>
                        <Td isNumeric>{stats.bowling_strike_rate?.toFixed(2)}</Td>
                        <Td isNumeric>{stats.bowling_average?.toFixed(2)}</Td>
                      </Tr>
                    )) : (
                      <Tr>
                        <Td colSpan={11} textAlign="center">No bowling statistics available yet.</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
            <TabPanel>
              <Box overflowX="auto" minW="1200px">
                <Table variant="simple" minWidth="1200px">
                  <Thead bg="blue.500">
                    <Tr>
                      <Th color="white">Player</Th>
                      <Th color="white" isNumeric>Matches</Th>
                      <Th color="white" isNumeric>WK Catches</Th>
                      <Th color="white" isNumeric>Stumpings</Th>
                      <Th color="white" isNumeric>WK Wickets</Th>
                      <Th color="white" isNumeric>Fielding Catches</Th>
                      <Th color="white" isNumeric>Run Outs</Th>
                      <Th color="white" isNumeric>Fielding Wickets</Th>
                      <Th color="white" isNumeric>Total Catches</Th>
                      <Th color="white" isNumeric>Total Victims</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {fieldingStats.length > 0 ? fieldingStats.map((stats) => (
                      <Tr key={stats.player_id}>
                        <Td fontWeight="medium">{stats.player_name}</Td>
                        <Td isNumeric>{stats.games}</Td>
                        <Td isNumeric>{stats.wk_catches}</Td>
                        <Td isNumeric>{stats.stumpings}</Td>
                        <Td isNumeric>{stats.total_wk_wickets}</Td>
                        <Td isNumeric>{stats.fielding_catches}</Td>
                        <Td isNumeric>{stats.run_outs}</Td>
                        <Td isNumeric>{stats.total_fielding_wickets}</Td>
                        <Td isNumeric>{stats.total_catches}</Td>
                        <Td isNumeric>{stats.total_victims}</Td>
                      </Tr>
                    )) : (
                      <Tr>
                        <Td colSpan={10} textAlign="center">No fielding statistics available yet.</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </VStack>
  );
}
