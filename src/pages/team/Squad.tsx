import { useEffect, useState } from "react";
import { Box, Heading, Text, VStack, SimpleGrid, Badge, HStack, Icon } from "@chakra-ui/react";
import { listPlayers, listPlayerStatistics } from "../../lib/db";
import type { Player, PlayerStatistics } from "../../lib/db";
import { FaBowlingBall, FaStar } from "react-icons/fa6";

export default function TeamSquad() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerStatistics[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [playersData, statsData] = await Promise.all([
        listPlayers(),
        listPlayerStatistics()
      ]);
      console.log("Players loaded:", playersData);
      console.log("Stats loaded:", statsData);
      setPlayers(playersData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load players or stats:", error);
    }
  }

  // Helper to get stats for a player
  function getPlayerStats(playerId: string) {
    const playerStat = stats.find(s => s.player_id === playerId);
    console.log(`Stats for player ${playerId}:`, playerStat);
    return playerStat;
  }

  // Helper to get skill icon
  function SkillIcon({ skill }: { skill?: string }) {
    if (skill === 'bowler') return <Icon as={FaBowlingBall} color="blue.400" title="Bowler" boxSize={5} />;
    if (skill === 'all-rounder') return <Icon as={FaStar} color="orange.400" title="All-rounder" boxSize={5} />;
    // Batsman: cricket bat emoji
    return <span role="img" aria-label="Batsman" style={{ fontSize: 24, color: 'green' }}>🏏</span>;
  }

  // Show all active players (including admins, secretary, treasurer, etc.)
  // Sort players alphabetically by full_name
  const sortedPlayers = [...players].sort((a, b) => 
    a.full_name.localeCompare(b.full_name)
  );

  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center">
        <Heading size="xl" mb={2} color="green.600">Squad Room</Heading>
        <Text color="gray.600">Meet our players and their key stats</Text>
      </Box>

      {stats.length === 0 && (
        <Box p={4} bg="yellow.100" borderRadius="md" textAlign="center">
          <Text>No player statistics found. Stats may need to be imported or created.</Text>
        </Box>
      )}

      <Box>
        <Badge colorScheme="gray" mb={2}>Players</Badge>
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
          {sortedPlayers.map(player => {
            const stat = getPlayerStats(player.id);
            return (
              <HStack key={player.id} p={4} borderWidth={1} borderRadius="md" bg="gray.50" spacing={4} align="center">
                <SkillIcon skill={player.skill} />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold">{player.full_name}</Text>
                  <HStack spacing={3} fontSize="sm" color="gray.600">
                    <Text>Runs: {stat?.runs ?? 0}</Text>
                    <Text>Wkts: {stat?.wickets ?? 0}</Text>
                    <Text>Victims: {stat?.total_victims ?? 0}</Text>
                  </HStack>
                </VStack>
              </HStack>
            );
          })}
        </SimpleGrid>
      </Box>
    </VStack>
  );
}
