import { useEffect, useState } from "react";
import { Box, Heading, Text, VStack, SimpleGrid, Badge, HStack, Icon, Flex, useColorModeValue, Stat, StatLabel, StatNumber, StatGroup, Divider } from "@chakra-ui/react";
import { listPlayers, listPlayerStatistics } from "../../lib/db";
import type { Player, PlayerStatistics } from "../../lib/db";
import { FaBowlingBall, FaStar, FaRunning, FaHandsHelping } from "react-icons/fa";

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
    switch(skill) {
      case 'bowler':
        return <Icon as={FaBowlingBall} color="blue.500" title="Bowler" boxSize={5} />;
      case 'all-rounder':
        return <Icon as={FaStar} color="purple.500" title="All-rounder" boxSize={5} />;
      default:
        // Default to batsman
        return <Icon as={FaRunning} color="green.500" title="Batsman" boxSize={5} />;
    }
  }
  
  // Helper to get skill color scheme
  function getSkillColor(skill?: string): string {
    switch(skill) {
      case 'bowler': return 'blue';
      case 'all-rounder': return 'purple';
      default: return 'green'; // Default to batsman
    }
  }
  
  // Helper to get skill display name
  function getSkillName(skill?: string): string {
    switch(skill) {
      case 'bowler': return 'Bowler';
      case 'all-rounder': return 'All-rounder';
      default: return 'Batsman';
    }
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

      <SimpleGrid columns={[1, null, 2, 3]} spacing={6} px={2}>
        {sortedPlayers.map(player => {
          const stat = getPlayerStats(player.id);
          const skillColor = getSkillColor(player.skill);
          const bgGradient = useColorModeValue(
            `linear(to-br, white, ${skillColor}.50)`,
            `linear(to-br, gray.800, ${skillColor}.900)`
          );
          
          return (
            <Box 
              key={player.id} 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
              transition="all 0.3s" 
              _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
              bgGradient={bgGradient}
            >
              <Box p={5}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Heading size="md" isTruncated>{player.full_name}</Heading>
                  <Badge colorScheme={skillColor} px={2} py={1} borderRadius="md">
                    <Flex align="center" gap={1}>
                      <SkillIcon skill={player.skill} />
                      <Text>{getSkillName(player.skill)}</Text>
                    </Flex>
                  </Badge>
                </Flex>
                
                <Divider mb={3} />
                
                <StatGroup>
                  <Stat>
                    <Flex align="center" mb={1}>
                      <Icon as={FaRunning} mr={1} color={`${skillColor}.500`} />
                      <StatLabel>Runs</StatLabel>
                    </Flex>
                    <StatNumber fontSize="xl">{stat?.runs ?? 0}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <Flex align="center" mb={1}>
                      <Icon as={FaBowlingBall} mr={1} color={`${skillColor}.500`} />
                      <StatLabel>Wickets</StatLabel>
                    </Flex>
                    <StatNumber fontSize="xl">{stat?.wickets ?? 0}</StatNumber>
                  </Stat>
                  
                  <Stat>
                    <Flex align="center" mb={1}>
                      <Icon as={FaHandsHelping} mr={1} color={`${skillColor}.500`} />
                      <StatLabel>Catches</StatLabel>
                    </Flex>
                    <StatNumber fontSize="xl">{stat?.total_catches ?? 0}</StatNumber>
                  </Stat>
                </StatGroup>
                
                {stat && (
                  <HStack mt={4} fontSize="sm" spacing={3} color="gray.500">
                    <Text>Inns: {stat.inns}</Text>
                    <Text>Avg: {stat.avg?.toFixed(2) ?? 0}</Text>
                    <Text>High: {stat.high_score}{stat.high_score_not_out ? '*' : ''}</Text>
                  </HStack>
                )}
              </Box>
            </Box>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
