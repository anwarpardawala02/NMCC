import { useEffect, useState } from "react";
import { Box, Heading, Text, Avatar, VStack, SimpleGrid, Badge } from "@chakra-ui/react";
import { listPlayers } from "../../lib/db";
import type { Player } from "../../lib/db";

export default function TeamSquad() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      const data = await listPlayers();
      setPlayers(data);
    } catch (error) {
      console.error("Failed to load players:", error);
    }
  }

  const secretary = players.find(p => p.role === "secretary");
  const treasurer = players.find(p => p.role === "treasurer");
  const admins = players.filter(p => p.role === "admin");
  const normalPlayers = players.filter(p => p.role === "player" || !p.role);

  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center">
        <Heading size="xl" mb={2} color="green.600">Our Team</Heading>
        <Text color="gray.600">Meet the people who make Northolt Manor Cricket Club possible</Text>
      </Box>

      {secretary && (
        <Box textAlign="center">
          <Badge colorScheme="blue" mb={2}>Club Secretary</Badge>
          <VStack>
            <Avatar size="xl" name={secretary.full_name} src={secretary.photo_url} />
            <Heading size="md">{secretary.full_name}</Heading>
            <Text color="gray.500">{secretary.email}</Text>
          </VStack>
        </Box>
      )}

      {treasurer && (
        <Box textAlign="center">
          <Badge colorScheme="purple" mb={2}>Treasurer</Badge>
          <VStack>
            <Avatar size="xl" name={treasurer.full_name} src={treasurer.photo_url} />
            <Heading size="md">{treasurer.full_name}</Heading>
            <Text color="gray.500">{treasurer.email}</Text>
          </VStack>
        </Box>
      )}

      {admins.length > 0 && (
        <Box>
          <Badge colorScheme="green" mb={2}>Admins</Badge>
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {admins.map(admin => (
              <VStack key={admin.id}>
                <Avatar name={admin.full_name} src={admin.photo_url} />
                <Text fontWeight="bold">{admin.full_name}</Text>
                <Text color="gray.500" fontSize="sm">{admin.email}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </Box>
      )}

      <Box>
        <Badge colorScheme="gray" mb={2}>Players</Badge>
        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
          {normalPlayers.map(player => (
            <VStack key={player.id}>
              <Avatar name={player.full_name} src={player.photo_url} />
              <Text fontWeight="bold">{player.full_name}</Text>
              <Text color="gray.500" fontSize="sm">{player.email}</Text>
            </VStack>
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
}
